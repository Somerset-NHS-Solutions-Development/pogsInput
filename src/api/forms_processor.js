const { TLRU } = require('tlru');
const fs = require('fs');
const path = require('path');
const logger = require('./../utils/logger');
const ehr = require('./ehr');

module.exports = Processor;

function Processor(formName, aqlFileName, processingCallback) {
	this.name = formName;
  this.aqlFileName = aqlFileName;
  this.callback = processingCallback;
	this.aqlCache = new TLRU({
		maxStoreSize: 1,
		maxAgeMs: process.env.CACHE_AQL_AGE_MINS * 60000 // convert to mins
	});
}

function readAQLFile(aql) {
	let aqlPath = path.join(__dirname, '/../aql/', aql);
	logger.debug('reading aql file: ' + aqlPath);
	return fs.readFileSync(aqlPath);
}

Processor.prototype.getAQL = function() {
	if(this.aqlCache.has('aql')) {
		return this.aqlCache.get('aql');
	} else {
		let aql = '' + readAQLFile(this.aqlFileName);
		aql = aql.replace(/\n/g, ' ').replace(/\r/g, '');
		this.aqlCache.set('aql', aql);
		return aql;
	}
}

Processor.prototype.callAQLAsync = async function(query = '') {
	if(query == '') {
		query = this.getAQL();
	}

	let stream = await ehr.executeQueryStream(query);
	let rows = [];
	if(stream && stream.length > 0) {
		let ret = '[' + stream.replace(/}\r\n{/g, '}, {') + ']';
		ret = ret.replace(/}{/g, '}, {');
		ret = ret.replace(/}\s+{/g, '}, {');
		try {
			rows = JSON.parse(ret);
		} catch(ex) {
			logger.error('Exception parsing JSON from AQL Query: ');
			logger.error(JSON.stringify(ex));
			logger.error('Returned Stream: ');
			logger.error(stream);
		}
	}
	return rows;
}

Processor.prototype.callAQLWithReplacementsAsync = async function(aReplace, aWith, replaceAll = true) {
	if(aReplace == undefined || aWith == undefined || aReplace.length == 0 || aWith.length == 0 || aReplace.length != aWith.length) {
		throw 'callAQLWithReplacementsAsync: Replace or With Array not valid'
	}

	let query = this.getAQL();
	for(let i = 0; i < aReplace.length; i++) {
		query = query.replace(aReplace[i], aWith[i]);
		while(replaceAll && query.includes(aReplace[i])) {
			query = query.replace(aReplace[i], aWith[i]);
		}
	}

	return await this.callAQLAsync(query);
}

Processor.prototype.getLatestPatientDataAsync = async function(mrn, admitted) {
	let query = this.getAQL();
	logger.debug('Querying ' + this.name + ' for patient ' + mrn);
	query = query.replace('<mrn>', mrn).replace('<date>', admitted);
	let rows = await this.callAQLAsync(query);
	// logger.debug('Returned Rows: ' + (rows ? rows.length : 'null'));

	if(!rows) {
		return null;
	}

	let data = {};
	// logger.system('Form contents: ' + JSON.stringify(rows));

	if((!Array.isArray(rows) && rows.status && rows.status == 400) || (rows.length > 0 && rows[0].status && rows[0].status == 400)) {
		logger.error(this.name + ': AQL returned status 400: ' + JSON.stringify(rows));
		return {
			mrn: mrn,
			exception: rows
		}
	}

	if(rows.length == 0) {
		// logger.debug('AQL returned no rows');
		return null;
	}

	data = this.callback(rows[0]);
	if(JSON.stringify(data.form_data).length < 50) {
		logger.system('Small Form data: ' + JSON.stringify(data))
	}
	data.mrn = mrn;
	return data;
}

Processor.prototype.gatherDataAsync = async function(mrnArray) {
	if(!mrnArray) {
		throw Error('MRN Array is null for form processor ' + this.name);
	}

	if(mrnArray.length == 0) {
		return [];
	}

	let formData = [];
	for(let i = 0; i < mrnArray.length; i++) {
			let dateCheck = new Date('2000-01-01T00:00:01').toISOString();
			if(mrnArray[i].demographics.admitted) {
				const newDate = new Date(mrnArray[i].demographics.admitted);
				newDate.setHours(newDate.getHours() - 48);
				dateCheck = newDate.toISOString();
				// logger.debug('Resetting exisitng admitted date to 48 hours hence: ' + dateCheck);
			}

			let data = await this.getLatestPatientDataAsync(mrnArray[i].mrn, dateCheck);
			formData.push(data);
	}
	return formData;
};
