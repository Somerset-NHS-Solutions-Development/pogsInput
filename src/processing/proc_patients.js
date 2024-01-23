const formsAPI = require('./../api/forms');
const DP = require('./data_process');
const path = require('path');
const fs = require('fs');
const ehr = require('./../api/ehr');

const demoAPI = require('./../api/demographics');

const logger = require('./../utils/logger');

function readAQLFile(aql) {
	let aqlPath = path.join(__dirname, '/../aql/', aql);
	logger.debug('reading aql file: ' + aqlPath);
	return fs.readFileSync(aqlPath) + '';
}

async function getMRNsFromFormsFrom48HoursAgo(aql) {
	let query = aql;
	// logger.debug('Query: ' + query);
	let d = new Date();
	d.setHours(d.getHours()-48);
	// logger.debug('48 hours ago is... ' + d.toISOString());
	query = query.replace(/<date>/g, d.toISOString());
	// logger.debug('48 hour query: ' + query);
	let stream = await ehr.executeQueryStream(query);
	// logger.debug('typeof stream: ' + typeof stream);
	let rows = [];
	if(stream && stream.length > 0) {
		stream = '[' + stream.replace(/}\r\n{/g, '}, {').replace(/}{/g, '}, {') + ']';
		try {
			rows = JSON.parse(stream);
		} catch(ex) {
			logger.error('Exception parsing JSON from AQL Query: ');
			logger.error(JSON.stringify(ex));
			logger.error('Returned Stream: ');
			logger.error(stream);
		}
	}
	return rows;
}

let aql = readAQLFile('mrns_of_att_in_48_hours.aql');
aql = aql.replace(/\n/g, ' ').replace(/\r/g, '');

const patients = new DP('patients',
process.env.PROCESSING_INTERVAL_PATIENTS_MINS,
async (args) => {
	patients.debug('Getting mrns from Demographics');
	let pats = [];
	try {
		pats = await demoAPI.getAllPatientsInWardsAsync(true);
	} catch(ex) {
		patients.error('Exception getting patient ward data');
		patients.error('Exception: ' + ex);
	  throw ex;
	}
	patients.debug('Getting mrns from Forms in the last 48 hours');
	let pats48 = [];
	try {
		pats48 = await getMRNsFromFormsFrom48HoursAgo(aql);
	} catch(ex) {
		patients.error('Could not get MRNs from 48 hours ago');
		patients.error('Exception: ' + ex);
	}

	const mrnSet = new Map();
	let dataTries = 3;
	if(pats) {
		patients.debug('Got ' + pats.length + ' patients in wards');
		for(let p of pats) {
			p.patient_type = 'Ward';
			p.demographics = {};
			try {
				if(dataTries > 0) {
					p.demographics = await demoAPI.getFullDataByPatientID(p.pid);
				}
			} catch(ex) {
				dataTries--;
				patients.error('Exception getting patient data');
				patients.error('Exception: ' + ex);
				if(dataTries <= 0) {
					patients.error('Skipping Demographic calls until next process interval');
				}
			} finally {
				mrnSet.set(p.mrn, p);
			}
		}
	}

	if(pats48) {
		dataTries = dataTries < 0 ? dataTries : 3;
		patients.debug('Got ' + pats48.length + ' patients from forms');
		for(let p of pats48) {
			if(!mrnSet.has(p.mrn)) {
				let att_pat = null;
				try {
					if(dataTries > 0) {
						att_pat = await demoAPI.getPatientDetailsByMRN(p.mrn);
					}
				} catch(ex) {
					dataTries--;
					logger.error('Could not get patient details by MRN (' + p.mrn + ')');
					logger.error('Exception: ' + ex);
					if(dataTries <= 0) {
						patients.error('Skipping Demographic calls until next process interval');
					}
				}

				if(att_pat) {
					p.pid = att_pat.id;
					logger.debug('pat name: ' + JSON.stringify(att_pat, null, 4));
					p.name = att_pat.name;
					p.patient_type = 'ATT';

					p.demographics = {};
					try {
						if(dataTries > 0) {
							p.demographics = await demoAPI.getFullDataByPatientID(p.pid, false);
						}
					} catch(ex) {
						dataTries--;
						patients.error('Exception getting patient data (48hr)');
						patients.error('Exception: ' + ex);
						if(dataTries <= 0) {
							patients.error('Skipping Demographic calls until next process interval');
						}
					} finally {
						mrnSet.set(p.mrn, p);
					}
				}
			}
		}
	}

	patients.debug('Coallescing mrns into unique objects');
	let ret = Array.from(mrnSet.values());
	return ret;
});

module.exports = patients;
