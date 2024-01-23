const formsAPI = require('./../api/forms');
// const ehr = require('./../api/ehr');
const DP = require('./data_process');
const { TLRU } = require('tlru');
const logger = require('./../utils/logger');
const path = require('path');
const fs = require('fs');

let last_execution = new Date('2020-01-01T00:00:01');

const aqlCache = new TLRU({
	maxStoreSize: 1,
	maxAgeMs: process.env.CACHE_AQL_AGE_MINS * 60000 // convert to mins
});

function readAQLFile(aql) {
	let aqlPath = path.join(__dirname, '/../aql/', aql);
	logger.debug('reading aql file: ' + aqlPath);
	return fs.readFileSync(aqlPath);
}

function getAQL() {
	if(aqlCache.has('aql')) {
		return aqlCache.get('aql');
	} else {
		let aql = '' + readAQLFile('mrns_of_latest_forms.aql');
		aql = aql.replace(/n/g, ' ').replace(/\r/g, '');
		aqlCache.set('aql', aql);
		return aql;
	}
}

const forms = new DP('forms', 0.5, async (args) => {
	let backDate = new Date();
	backDate.setSeconds(backDate.getSeconds()-5);

	forms.debug('Getting new form mrns since ' + last_execution.toISOString());

	let aql = getAQL();
	aql = aql.replace("<date>", last_execution.toISOString());

	forms.debug('new AQL: ' + aql);

	const mrnArray  = []; // await ehr.executeQueryStream(aql);

	forms.debug('latest mrns: ' + mrnArray);

	mrnArray = mrnArray.filter((m) => {
		if(!args.find((a) => {
			return a.mrn == m.mrn;
		})) {
			return false;
		}
		return true;
	});

	const data = await formsAPI.getLatestFormDataForPatientsAsync(mrnArray);

	last_execution = backDate;
	return data;
});

module.exports = forms;
