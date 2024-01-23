const https = require('https');
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const logger = require('./../utils/logger');

const bigbrother = require('./../utils/bigbrother').getMonitor('openid', 200);


module.exports.login = () => {
	const form = {
				client_id: (process.env.openIDClientID),
				grant_type: 'client_credentials',
				client_secret: (process.env.openIDClientSecret)
		};
		const formData = querystring.stringify(form);
		const contentLength = formData.length;

		const options = {
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'Content-Length': contentLength,
			}
		}
		// console.log('oid enpoint: ', process.env.openIDDirectAccessEnpoint);

		return new Promise((resolve, reject) => {
			const reqs = https.request(process.env.openIDDirectAccessEnpoint, options, (ress) => {
				ress.setEncoding('utf8');
				ress.on('data', (d) => {
					bigbrother.report(ress.statusCode);
					const json = JSON.parse(d);
					var fred = jwt.decode(ress.access_token);
		    	resolve(json);
	  		});
			});

			reqs.on('error', (e) => {
				bigbrother.report(e.code);
				logger.error('Error logging in: ' + JSON.stringify(e, null, 4));
				reject({
					message: 'Error logging in.',
					error: e
				})
			});

			reqs.on('timeout', () => {
				bigbrother.report('TIMEOUT');
				reject({
					message: 'Timeout logging in.'
				})
			});

			reqs.write(formData);

			reqs.end();
		});


}

function isAuthValid(auth) {
	if(!auth) {
		return false;
	}
	const d = new Date();
	// logger.auth('Is auth date of ' + auth.expires_at.toISOString() + ' greater than ' + d.toISOString());
	return auth.expires_at > d;
}

let authObject = null;
module.exports.longLogin = async () => {
	// maintains the access token for as long as valid, renews when expired or within 5 seconds of expiry,
	// otherwsie behaves as login() above
	if(!authObject || !isAuthValid(authObject)) {
		logger.auth('Auth token null or expired, re-logging in');
		const result = await this.login();
		if(result && result.expires_in) {
			authObject = result;
			let d = new Date();
			d.setSeconds(d.getSeconds() + (Number(authObject.expires_in)-5));
			authObject.expires_at = d;
			logger.auth('New Token expires in ' + authObject.expires_in + ', at ' + authObject.expires_at.toISOString());
		} else {
			logger.auth('Could not log in... ' + JSON.stringify(result));
		}
	}
	return authObject.access_token;
};
