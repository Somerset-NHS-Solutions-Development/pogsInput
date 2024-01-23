const fs = require('fs')
const logger = require('./logger');

exports.readFile = (filepath) => {
	return new Promise((resolve, reject) => {
		fs.readFile(filepath, (err, data) => {
		  if (err) {
		    return reject(err);
		  }
			logger.debug('read data! ' + typeof data);
		  resolve(data);
		})
	}).catch((ex) => {
		logger.error('Could not read file: ' + filepath);
		logger.error('Exception: ' + ex);
		resolve('');
	});
};

exports.encodeToBase64 = (buffer) => {

}
