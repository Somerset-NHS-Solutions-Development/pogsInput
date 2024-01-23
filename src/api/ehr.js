const querystring = require('querystring');
const keycloak = require('./login.js');
const logger = require('./../utils/logger');

const http_protocol = require('http');
const https_protocol = require('https');

const bigbrother = require('./../utils/bigbrother').getMonitor('ehr', 200);


function getHTTPProtocol(protocol) {
	if(protocol.startsWith('https')) {
		return https_protocol;
	}
	return http_protocol;
}

let basic_auth = null;

function setBasicAuthCredentials(headers) {
	if(!basic_auth) {
		basic_auth = 'Basic ' + new Buffer.from(process.env.EHR_BASIC_AUTH_USER + ':' + process.env.EHR_BASIC_AUTH_PASS).toString('base64')
	}
	headers.Authorization = basic_auth;
	return headers;
}

function parseDeletionData(data) {
	if(data == null || data == undefined || data.length == 0) {
		logger.warn('No Deletion Data to Parse!');
		return {};
	}

	data = JSON.parse(data);

	for(let ov of data) {
		if(ov.commit_audit && ov.commit_audit.change_type && ov.commit_audit.change_type.value == 'deleted') {
			let deleted = {
				committer: 'UNKNOWN',
				reason: 'UNKNOWN',
				time_stamp: 'UNKNOWN'
			};

			if(ov.commit_audit.time_committed) {
				deleted.time_stamp = ov.commit_audit.time_committed.value;
			}

			if(ov.commit_audit.committer) {
				deleted.committer = ov.commit_audit.committer.name;
			}

			if(ov.commit_audit.description) {
				deleted.reason = ov.commit_audit.description.value;
			}

			return deleted;
		}
	}

	return {};
}

exports.getFormDeletionInfo = (ehr_id, composition_uid) => {
	logger.debug('Deletion info: ', ehr_id, ', ', composition_uid);
	return new Promise((resolve, reject) => {
		// logger.system('Auth Token longevity check: ' + JSON.stringify(result));
		const options = {
			'method': 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		};

		composition_uid = composition_uid.split('::');

		options.headers = setBasicAuthCredentials(options.headers);

		const h = getHTTPProtocol(process.env.OpenEHRRestServer.trim());
		const url = process.env.OpenEHRRestServer.trim() + process.env.OpenEHRRestEHR.trim() +
								ehr_id + process.env.OpenEHRRestVersionComposition.trim() +
								composition_uid[0] + process.env.OpenEHRRestRevisionHistory.trim();
		logger.call('Version History url: ' + url);

		const req = h.get(url, options, (res) => {
			res.setEncoding('utf8');
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				bigbrother.report(res.statusCode);
				try {
					return parseDeletionData(data)
				}
				catch (ex) {
					logger.error('Error parsing deletion data: ' + JSON.stringify(ex, null, 4));
					logger.error('Data: ' + data);
					return reject(ex);
				}

			});
		}).on('error', (ex) => {
			bigbrother.report(ex.code);
			logger.error('Error executing version history ' + JSON.stringify(ex, null, 4));
			return reject(ex);
		}).on('timeout', () => {
			bigbrother.report('TIMEOUT');
			return reject(new Error('Timeout'));
		});
	});
};

exports.executeQueryStream = async (aql) => {
	// logger.debug('Query Stream');
	return new Promise((resolve, reject) => {
		// logger.system('Auth Token longevity check: ' + JSON.stringify(result));
		const options = {
			'method': 'POST',
			headers: {
				'Content-Type': 'application/json',
		  	'Accept': 'application/stream+json'
			}
		};

		options.headers = setBasicAuthCredentials(options.headers);

		const body = JSON.stringify({
			"aql": aql
		});

		const h = getHTTPProtocol(process.env.OpenEHRServer.trim());
		const url = `${process.env.OpenEHRServer.trim()}/${process.env.QueryStream.trim()}`;
		logger.call('Query Stream url: ' + url);

		const req = h.request(url, options, (res) => {
			res.setEncoding('utf8');
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				bigbrother.report(res.statusCode);
				return resolve(data);
			});
		}).on('error', (ex) => {
			bigbrother.report(ex.code);
			logger.error('Error executing aql query stream ' + JSON.stringify(ex, null, 4));
			return reject(ex);
		}).on('timeout', () => {
			bigbrother.report('TIMEOUT');
			return reject(new Error('Timeout'));
		});
		req.write(body);
		req.end();
	});
};

exports.getEHRIDByMRN = (mrn) => {
	//console.log('Getting EHRID by MRN: ', mrn);
	return new Promise((resolve, reject) => {
		const options = {
			'method': 'get',
			'json': true,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		};

		options.headers = setBasicAuthCredentials(options.headers);


		// console.log('barer token: ', access_token);

		const h = getHTTPProtocol(process.env.OpenEHRServer.trim());

		if(process.env.TEST_MRN.trim() == 'true') {
				mrn = '2011101';
		}

		const url = process.env.OpenEHRServer.trim() + '/ehr?' + process.env.OpenEHRSubject.trim() + '=' + mrn +
								'&' + process.env.OpenEHRSubjectNamespace.trim() + '=' + process.env.OpenEHRNamespace.trim();

		logger.call('url: ' + url);
		try {
			h.get(url, options, (res) => {
				res.setEncoding('utf8');

				let data = '';

				res.on('data', (chunk) => {
					data += chunk;
				});

				res.on('end', () => {
					bigbrother.report(res.statusCode);
					// console.log('end of response: ', res.statusCode)
					if(res.statusCode == 204) {
						return resolve(null);
					}

					if((mrn + '').endsWith('101')) {
						console.log('HTTP Protocol switch 101');
						// console.log('Data: ', data);
					}
					//

					const json = JSON.parse(data);
					// console.log('Buffer: ', JSON.stringify(json, null, 4));
					resolve(json.ehrId);
				});
			}).on('error', (ex) => {
				bigbrother.report(ex.code);
				logger.error('error in get request' + ex);
				return reject(ex);
			}).on('timeout', () => {
				bigbrother.report('TIMEOUT');
				return reject(new Error('Timeout'));
			});
		} catch(ex) {
			logger.error(`Exception: ` + ex);
			return reject(ex);
		}
	});
};
