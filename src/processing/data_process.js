const logger = require('./../utils/logger');
const waitUntil = require('wait-until');
const utils = require('./../utils/utils');

module.exports = Processor;

function Processor(processName, intervalMins = 666, callback, startingArgs = [], arrayReturn = true) {
	this.proc_name = processName;
	this.process_every_mins = intervalMins;
	this.copyLock = false;
	this.argsLock = false;
	this.processLock = false;
	this.data_live = {
		"type": "json",
		"timestamp": '',
		data: arrayReturn ? [] : {}
	};
	this.data_old = {
		"type": "json",
		"timestamp": '',
		data: arrayReturn ? [] : {}
	}
	this.token = null;
	this.callback = callback;
	this.args = startingArgs;
	this.fails = 0;
	this.total_fails = 0;
	this.max_fails = Number(process.env.process_fail_count)
	this.history_of_failure = false;
	this.created_time = new Date(),
	this.start_time = null,
	this.stop_time = null;
	this.last_process_time = 0;
	this.avg_process_time = 0;
	this.executions = 0;
	this.total_process_time = 0;
	this.elapsed = Date.now();
}

Processor.prototype.info = function(line) {
	logger.info(this.proc_name + ': ' + line);
}

Processor.prototype.debug = function(line) {
	logger.debug(this.proc_name + ': ' + line);
}

Processor.prototype.error = function(line) {
	logger.error(this.proc_name + ': ' + line);
}

Processor.prototype.warn = function(line) {
	logger.warn(this.proc_name + ': ' + line);
}

Processor.prototype.system = function(line) {
	logger.system(this.proc_name + ': ' + line);
}

Processor.prototype.waitForDataSwitch = function() {
	waitUntil().interval(100).times(200).condition(() => {
		//this.debug('Data Copy lock =' + this.copyLock);
		return !this.copyLock;
	}).done((result) => {
		if(result) {
			this.debug('Updating Old Stats');
			this.data_old = this.data_live;
		} else {
			this.warn('waitForDataSwitch waitUntil expired before switch');
		}
	});
}

Processor.prototype.getDataAsync = async function() {
	return new Promise((resolve, reject) => {
		if(!this.processLock) {
			this.debug('Returning New Dashboard Stats Data');
			return resolve(this.data_live);
		} else {
			this.copyLock = true;
			this.warn('Returning Old Dashboard Stats Data');
			resolve(this.data_old);
			this.copyLock = false;
		}
	});
}

Processor.prototype.updateProcessArgs = function(args) {
	waitUntil().interval(50).times(100).condition(() => {
		return !this.argsLock;
	}).done(() => {
		this.argsLock = true;
		this.args = args;
		this.argsLock = false;
		// this.processCallBack();
	});
}

Processor.prototype.setPrcocessingTimes = function(start, end) {
	this.last_process_time = end - start;
	this.total_process_time += this.last_process_time;
	this.avg_process_time = this.total_process_time/this.executions;
}


Processor.prototype.processCallBack = function() {
	waitUntil().interval(50).times(100).condition(() => {
		return !this.argsLock;
	}).done(async () => {
		this.argsLock = true;
		const a = this.args;
		this.argsLock = false;
		if(!this.processLock) {
			this.elapsed = Date.now();
			this.processLock = true;
			this.debug('Calling back...');
			this.callback(a).then((data) => {
				const now = new Date();
				this.data_live = {
					"type": "json",
					"timestamp": now,
					data
				};
				this.executions++;
				this.setPrcocessingTimes(this.elapsed, Date.now());
				this.debug('Process timing: ' + utils.getDateDiffInString(this.elapsed, Date.now()));
				this.fails = 0;
				this.waitForDataSwitch();
			}).catch((ex) => {
				this.fails++;
				this.total_fails++;
				this.error('Exception in processing... ');
				// this.error('Args: ' + JSON.stringify(a));
				this.error('Exception: ' + JSON.stringify(ex, null, 4));
				this.error('Fail Count: ' + this.fails + ' vs ' + this.max_fails);
				if(this.fails >= this.max_fails) {
					this.error('Fail count met limit: ' + this.max_fails + ', stopping process');
					this.error('This problem was likely caused by config or connection errors of the following: demographics, fhir, ehr, keycloak.');
					this.error('Please make sure the .env.xxxxxx file is correct and restart the process with pm2 delete then pm2 start');
					this.error('If the issue has been resolved externally, call (POST) this service with the /data/unfail end point, then /data/start. That will restart processing without needing to restart the service');
					this.history_of_failure = true;
					this.stopProcess();
					this.deferredStart();
				}
			}).finally(() => {
				this.processLock = false;
			});
		} else {
			this.warn('Process lock enabled, skipping.');
			this.warn('Current process time: ' + utils.getDateDiffInString(this.elapsed, Date.now()) + ', with processing interval set to ' + this.process_every_mins + ' mins');
		}
	});
}

Processor.prototype.clearToken = function() {
	clearTimeout(this.token);
	this.token = null;
}

Processor.prototype.clearFailure = function() {
	if(this.history_of_failure) {
		this.clearToken();
	}
	this.history_of_failure = false;
	this.fails = 0;
}

Processor.prototype.stopProcess = function() {
	this.clearToken();
	this.stop_time = new Date();
	this.debug('Process stopped.');
}

Processor.prototype.deferredStart = function() {
	if(this.history_of_failure) {
		this.system('Deferred start called. Will retry processing in ' + process.env.PROCESSING_LONG_WAIT_RETRY_HOURS + ' hours');
		this.token = setTimeout(() => {
			this.warn('Clearing failures before restarting');
			this.clearFailure();
			this.clearToken();
			this.warn('Restarting process')
			this.startProcess();
		}, process.env.PROCESSING_LONG_WAIT_RETRY_HOURS * 3600000); // milliseconds
		return;
	}
	this.warn('Deferred start called, but no history of failure detected. Starting processing immediately');
	this.startProcess();
}

Processor.prototype.startProcess = function() {
	if(!this.token) {
		if(this.history_of_failure) {
			this.warn('Process Start attempted, but has a history of failure. Clear Failure first.');
			return;
		}

		this.debug('Starting Process');
		this.token = { go: true };
		setTimeout(() => {
			this.processCallBack();
			if(this.process_every_mins > 0) {
				this.token = setInterval(() => {
					this.processCallBack()
				}, this.process_every_mins * 60000); // milliseconds
			} else {
				this.token = null;
			}
		}, 5000);
		this.stop_time = null;
		this.start_time = new Date();
		this.debug('Process started.');
	}
}

Processor.prototype.getProcessName = function () {
	return this.proc_name;
}

Processor.prototype.getStatus = function() {
	return {
		proc_name: this.proc_name,
		created: this.created_time,
		started: this.start_time,
		stopped: this.stop_time,
		run_time: this.stop_time ? null : utils.getDateDiffInString(this.start_time, Date.now()),
		recent_failures: this.fails,
		total_failures: this.total_fails,
		interval: `${this.process_every_mins} minutes`,
		last_execution_time: this.last_process_time + 'ms',
		avg_execution_time: this.avg_process_time + 'ms',
		executions: this.executions
	};
}

Processor.prototype.isRunning = function() {
	return this.token ? true : false;
}
