const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

var InMemoryLogTransport = require('./in-memory-logger.js');

const logDir = process.env.LogDir;
let logLevel = process.env.LogLevel;

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const memLogTransportInfo = new InMemoryLogTransport({
	level: 'info',
	max: 100
});

const memLogTransportDebug = new InMemoryLogTransport({
	level: 'debug',
	max: 500
});

const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: `${logDir}/%DATE%-server.log`,
  datePattern: 'YYYY-MM-DD',
  format: winston.format.combine(
        winston.format.printf(
          info =>
            `${info.timestamp} ${info.level}: ${info.message}`
        )
    )
});

const consoleTransport = new winston.transports.Console({
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.printf(
			info =>
				`${info.timestamp} ${info.level}: ${info.message}`
		)
	)
});

const customLevels = {
	levels: {
		system: 0,
		error: 1,
		warn: 2,
		info: 3,
		auth: 4,
		debug: 5,
		calls: 6,
	},
	colors: {
		system: 'cyan',
		error: 'red',
		warn: 'yellow',
		info: 'white',
		auth: 'black whiteBG',
		debug: 'white',
		calls: 'magenta',
	}
};

winston.addColors(customLevels.colors);

const logger = winston.createLogger({
	levels: customLevels.levels,
  level: logLevel,
  format: winston.format.combine(
		winston.format.label({ label: path.basename(process.mainModule.filename) }),
	    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
	  ),
	  transports: [
	    consoleTransport,
	    dailyRotateFileTransport,
			memLogTransportInfo,
			memLogTransportDebug
	  ]
});

logger.debug = (...line) => {
	logger.log('debug', line.join());
};

logger.info = (...line) => {
	logger.log('info', line.join());
};

logger.call = (...line) => {
	logger.log('calls', line.join());
};

logger.system = (...line) => {
	logger.log('system', line.join());
};

logger.auth = (...line) => {
	logger.log('auth', line.join());
};

logger.setLogLevel = (level) => {
	logger.system('Setting log level from ' + logLevel + ' to ' + level);
	dailyRotateFileTransport.level = level;
	consoleTransport.level = level;
	logLevel = level;
};

logger.getLogLevel = () => {
	return logLevel;
};

logger.getCurrentLogLevels = () => {
	return {
		levels: {
			file: dailyRotateFileTransport.level,
			console: consoleTransport.level
		}
	};
};

logger.setSystemLevel = () => {
	logger.setLogLevel('system');
};
logger.setWarningLevel = () => {
	logger.setLogLevel('warn');
};
logger.setErrorLevel = () => {
	logger.setLogLevel('error');
};
logger.setInfoLevel = () => {
	logger.setLogLevel('info');
};
logger.setAuthLevel = () => {
	logger.setLogLevel('auth');
};
logger.setDebugLevel = () => {
	logger.setLogLevel('debug');
};
logger.setCallsLevel = () => {
	logger.setLogLevel('calls');
};

logger.silenceConsoleLogging = () => {
	consoleTransport.silent = true;
	logger.system('Console logging disabled');
};
logger.muteConsoleLogging = () => {
	consoleTransport.silent = false;
	consoleTransport.level = 'error';
	logger.system('Console logging muted to errors and system');
};
logger.enableConsoleLogging = () => {
	consoleTransport.level = dailyRotateFileTransport.level;
	logger.system('Console loging reset to file logging level ' + logger.getLogLevel());
};

logger.logLevelTester = () => {
	let currentLevel = logger.getLogLevel();
	logger.system('Current log level is... ' + currentLevel);

	const logLevelTest = (newLevel) => {
		logger.setLogLevel(newLevel);
		logger.system('Test System');
		logger.error('Test Error');
		logger.warn('Test Warn');
		logger.info('Test Info');
		logger.auth('Test Auth');
		logger.debug('Test Debug');
		logger.call('Test Calls');
	};

	logLevelTest('system');
	logLevelTest('error');
	logLevelTest('warn');
	logLevelTest('info');
	logLevelTest('auth')
	logLevelTest('debug');
	logLevelTest('calls');

	logger.system('Resetting log level to original level, ' + currentLevel);
	logger.setLogLevel(currentLevel);
};

if(process.env.MuteConsole == 'true') {
	logger.muteConsoleLogging();
}

function getCurrentLogPath() {
	const d = new Date();
	const dt = d.getFullYear() +'-'+ ((d.getMonth()+1)+'').padStart(2, '0') +'-'+ (d.getDate()+'').padStart(2, '0');
	// logger.system('Log file: ' + `${logDir}/${dt}-server.log`);
	return `${logDir}/${dt}-server.log`;
}

logger.getCurrentLogFileAsync = () => {
	return new Promise((resolve, reject) => {
		fs.readFile(getCurrentLogPath(), 'utf8', function (err, data) {
		  if (err) {
				system.error('Error reading lo file: ' + JSON.stringify(err, null, 4));
		    return reject(err);
		  }
			console.log('log data: ' + data);
			let arr = data.split('\r\n');
			if(arr.length == 1) {
				arr = arr[0].split('\n');
			}
		  return resolve(arr);
		});
	});
}

logger.getInfoMemoryLogAsync = async (nLines) => {
	return await memLogTransportInfo.getLogAsync(nLines);
};

logger.getDebugMemoryLogAsync = async (nLines) => {
	return await memLogTransportDebug.getLogAsync(nLines);
};

module.exports = logger;
