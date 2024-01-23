const logger = require('./../utils/logger');
const waitUntil = require('wait-until');
const DP = require('./data_process');
const { TLRU } = require('tlru');

const fileIn = require('./proc_filesInManager');
const fileProcessor = require('./proc_fileProcessor');
var docDB = require('./../api/docdb');

var runningRecord = {
 files_processed: 0,
 file_history: [],
 docs_available: []
};

const main = new DP('main', process.env.PROCESSING_INTERVAL_MAIN_MINS, async (args) => {
	main.debug('Getting new files in...');
	let filesInData = await fileIn.getDataAsync();
	main.info('From Files in: ' + JSON.stringify(filesInData));
	if (filesInData && filesInData.data && filesInData.data.ready) {
		for (var i = 0; i < filesInData.data.ready.length; i++) {
			main.info('New file: ' + filesInData.data.ready[i].name);
		}

		fileProcessor.updateProcessArgs({
			ready: filesInData.data.ready
		});
	}
	var processed = await fileProcessor.getDataAsync()
	main.info('Got Processed data: ' + JSON.stringify(processed))
	if (processed && processed.data) {
		if (processed.data.files) {
			for (let i = 0; i < processed.data.files.length; i++) {
				main.info('Processed: ' + processed.data.files[i].name);
				runningRecord.files_processed += 1;
				runningRecord.file_history.push(processed.data.files[i].name);
			}

			fileIn.updateProcessArgs({
				processed: processed.data.files
			});
		}

		if (processed.data.docs) {
			for (var i = 0; i < processed.data.docs.length; i++) {
				main.system('Adding Doctor: ' + JSON.stringify(processed.data.docs[i]));
				docDB.addDoctor(processed.data.docs[i]);
				runningRecord.docs_available.push({ first: processed.data.docs[i].first, tfa: processed.data.docs[i].tfa});
			}
		}

		
	}
	return runningRecord;
}, [], false);

const processes = [main, fileIn, fileProcessor];

exports.getDocDataByTFA = (tfa) => {
	return docDB.getDocDataByTFA(tfa);
}

exports.getAllTFAs = () => {
	return docDB.getAllTFAs();
}

exports.getAllDocData = () => {
	return docDB.getAllDocData();
}


exports.clearFailedProcesses = () => {
	processes.forEach((p, i) => {
		p.clearFailure();
	});
}

exports.forceGeneralStats = () => {
	processes.forEach((p, i) => {
		p.startProcess();
	});
}

exports.startDataGathering = () => {
	processes.forEach((p, i) => {
		p.startProcess();
	});
}

exports.stopDataGathering = () => {
	processes.forEach((p, i) => {
		p.stopProcess();
	});
}

exports.dataGatheringStatus = () => {
	let s = {};
	processes.forEach((p, i) => {
		s[p.getProcessName()] = p.getStatus();
	});
	return s;
}

exports.getDashboardStatsAsJSON = async () => {
	return await main.getDataAsync();
};

// exports.getSlowQueryResults = async () => {
// 	return await slow_queries.getDataAsync();
// }

// exports.getTraumaFormResults = async () => {
// 	return await trauma_forms.getDataAsync();
// }

// exports.getDemographicsByMRNAsync = (id) => {
// 	return new Promise((resolve, reject) => {
// 		waitUntil().interval(10).times(10).condition(() => {
// 			return !demographics_lock;
// 		}).done((result) => {
// 			if(!result) {
// 				return resolve(null);
// 			}
// 			let demo = null;
// 			patientAccess_lock = true;
// 			demo = demoMRNCache.get(id);
// 			if(!demo) {
// 				demo = demoNHSCache.get(id);
// 			}
// 			patientAccess_lock = false
// 			return resolve(demo);
// 		});
// 	});


// }

this.startDataGathering();
