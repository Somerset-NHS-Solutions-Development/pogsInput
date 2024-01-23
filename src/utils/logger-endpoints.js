
const express = require('express');
const router = express.Router();

const verifyToken = require('./../handlers/verify-token');

const logger = require('./logger');

// Asynch Middleware
const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
};

function getLogLevelJSON(l) {
	return {
		old: l,
		new: logger.getLogLevel()
	}
}

const setErrorLoggingLevel = async (req, res, next) => {
	let l = logger.getLogLevel();
	logger.setErrorLevel();
	return res.status(200).json(getLogLevelJSON(l));
};
const setSystemLoggingLevel = async (req, res, next) => {
	let l = logger.getLogLevel();
	logger.setSystemLevel();
	return res.status(200).json(getLogLevelJSON(l));
};
const setWarningLoggingLevel = async (req, res, next) => {
	let l = logger.getLogLevel();
	logger.setWarningLevel();
	return res.status(200).json(getLogLevelJSON(l));
};
const setInfoLoggingLevel = async (req, res, next) => {
	let l = logger.getLogLevel();
	logger.setInfoLevel();
	return res.status(200).json(getLogLevelJSON(l));
};
const setAuthLoggingLevel = async (req, res, next) => {
	let l = logger.getLogLevel();
	logger.setAuthLevel();
	return res.status(200).json(getLogLevelJSON(l));
};
const setDebugLoggingLevel = async (req, res, next) => {
	let l = logger.getLogLevel();
	logger.setDebugLevel();
	return res.status(200).json(getLogLevelJSON(l));
};
const setCallsLoggingLevel = async (req, res, next) => {
	let l = logger.getLogLevel();
	logger.setCallsLevel();
	return res.status(200).json(getLogLevelJSON(l));
};
const silenceConsoleLogging = async (req, res, next) => {
	logger.silenceConsoleLogging();
	return res.status(200).json({
		message: 'console logging silenced'
	});
};
const muteConsoleLogging = async (req, res, next) => {
	logger.muteConsoleLogging();
	return res.status(200).json({
		message: 'console logging set to error level',
		levels: logger.getCurrentLogLevels()
	});
};
const resetConsoleLogging = async (req, res, next) => {
	logger.enableConsoleLogging();
	return res.status(200).json({
		message: 'error logging level reset to match file logging',
		levels: logger.getCurrentLogLevels()
	});
};

const getWholeLogFile = async (req, res, next) => {
	try {
		const data = await logger.getCurrentLogFileAsync();
		return res.status(200).json({
			message: 'log read ok',
			log: data
		});
	} catch(ex) {
		return res.status(500).json({
			message: ex
		});
	}

};

async function tailLog(level, lines) {
	message = 'Tail OK';
	let data = [];
	let status = 200;
	try {
		if(level == 'debug') {
			data = await logger.getDebugMemoryLogAsync(lines);
		} else {
			data = await logger.getInfoMemoryLogAsync(lines);
		}
	} catch(ex) {
		logger.error('Exception in TAIL: ' + JSON.stringify(ex, null, 4))
		message = JSON.stringify(ex, null, 4);
		status = 500;
	}

	const dataLength = data ? data.length : 0;

	return {
		message,
		level: level,
		lines_request: lines,
		log_length: dataLength + '',
		log: data,
		status: status
	}
}

const tailInfoLog = async (req, res, next) => {
	let lines = 100;
	if(req.query && req.query.lines && !isNaN(req.query.lines)) {
		lines = req.query.lines;
	}
	const data = await tailLog('info', lines);
	return res.status(data.status).json(data);
};

const tailDebugLog = async (req, res, next) => {
	let lines = 100;
	if(req.query && req.query.lines && !isNaN(req.query.lines)) {
		lines = req.query.lines;
	}
	const data = await tailLog('debug', lines);
	return res.status(data.status).json(data);
};

const getLogLevels = async(req, res, next) => {
	return res.status(200).json(logger.getCurrentLogLevels());
};

//loggingLevels
router.get('/levels', asyncMiddleware(getLogLevels));
router.get('/tail/info', verifyToken, asyncMiddleware(tailInfoLog));
router.get('/tail/debug', verifyToken, asyncMiddleware(tailDebugLog));
router.get('/whole', verifyToken, asyncMiddleware(getWholeLogFile));

router.put('/system', verifyToken, asyncMiddleware(setSystemLoggingLevel));
router.put('/error', verifyToken, asyncMiddleware(setErrorLoggingLevel));
router.put('/warn', verifyToken, asyncMiddleware(setWarningLoggingLevel));
router.put('/info', verifyToken, asyncMiddleware(setInfoLoggingLevel));
router.put('/auth', verifyToken, asyncMiddleware(setAuthLoggingLevel));
router.put('/debug', verifyToken, asyncMiddleware(setDebugLoggingLevel));
router.put('/calls', verifyToken, asyncMiddleware(setCallsLoggingLevel));

router.put('/console/silence', verifyToken, asyncMiddleware(silenceConsoleLogging));
router.put('/console/mute', verifyToken, asyncMiddleware(muteConsoleLogging));
router.put('/console/reset', verifyToken, asyncMiddleware(resetConsoleLogging));

module.exports = router;
