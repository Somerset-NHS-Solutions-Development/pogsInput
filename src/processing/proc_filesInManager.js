const DP = require('./data_process');
const fs = require('fs');
const path = require('path');

const isFile = fileName => {
	filesIn.info('Is file? ' + JSON.stringify(fileName));
	return fs.lstatSync(fileName.in_path).isFile();
};

var inFolder = {
	ready: []
};

const moveFile = async (from, to) => {
	await fs.rename(from, to, (err) => {
		if (err) throw err;
			filesIn.info(from + ' moved to ' + to);
	});
};

//C:\dev\repos\pogsInput\working\in
const in_path = path.join(__dirname, '/../../working/in/');
const proc_path = path.join(__dirname, '/../../working/proc/');
const done_path = path.join(__dirname, '/../../working/done/');

const getNewFiles = () => {
	return fs.readdirSync(in_path)
		.map(fileName => {
			return {
				name: fileName,
				in_path: path.join(in_path, fileName),
				proc_path: path.join(proc_path, fileName),
				done_path: path.join(done_path, fileName),
			};
		})
		.filter(isFile).filter((f) => {
			return f.in_path.endsWith('.csv');
		});
};

const filesIn = new DP('filesIn', process.env.PROCESSING_INTERVAL_FILES_IN_MINS,
async (args) => {
	filesIn.debug('Checking for new Files');
	var newFiles = getNewFiles();

	for(var i = 0; i < newFiles.length; i++) {
		await moveFile(newFiles[i].in_path, newFiles[i].proc_path);
	}

	filesIn.info('Any files processed? ' + JSON.stringify(args));
	if (args && args.processed && args.processed.length > 0) {
		filesIn.info('Files Processed...' + args.processed.length);
		for (let i = 0; i < args.processed.length; i++) {
			filesIn.info('Moving file from process to done: ' + args.processed[i].name);
			await moveFile(args.processed[i].proc_path, args.processed[i].done_path);
		}
	}

	filesIn.info('new files processed: ' + JSON.stringify(newFiles));

	return {ready: newFiles};
});

filesIn.info('In path: ' + in_path);
filesIn.info('Proc path: ' + proc_path);
filesIn.info('Done path: ' + done_path);

module.exports = filesIn;