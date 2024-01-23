const logger = require('./../utils/logger');
const { TLRU } = require('tlru');
const waitUntil = require('wait-until');

module.exports = Forms;

function Forms(formProcessArray) {
	this.formsArray = formProcessArray ? formProcessArray : [];
}

function consolidateFormData(dataArray, formMap) {
	logger.debug('Consollidating Form Data ...');
	for(let d of dataArray) {
		// logger.debug('Is data good? ' + d ? 'Yarp' : 'Narp');
		// logger.debug('D: ' + JSON.stringify(d));
		if(d) {
			let f = null;
			// logger.debug('Forms data: ' + JSON.stringify(d));
			if(formMap.has(d.mrn)) {
				f = formMap.get(d.mrn);
			} else {
				f = {
					mrn: d.mrn,
					form_data: {}
				};
			}
			f.form_data[d.form_name] = d.form_data;
			// logger.debug('Current Form: ' + JSON.stringify(f));
			formMap.set(d.mrn, f);
		}
	}
	return formMap;
}

Forms.prototype.getLatestFormDataForPatientsAsync = async function(patientArray) {
	let formMap = new Map();
	for(let i = 0; i < this.formsArray.length; i++) {
		const dataArray = await this.formsArray[i].gatherDataAsync(patientArray);
		logger.debug('Form data array: ' + (dataArray ? dataArray.length : 'null'));
		formMap = consolidateFormData(dataArray, formMap);
	}

	const fA = Array.from(formMap.values());
	logger.debug('Form array length: ' + (fA ? fA.length : 'null'));
	// logger.debug('Array contents: ' + JSON.stringify(fA));
	return fA;
};
