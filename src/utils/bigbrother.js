const littleBro = require('./littlebrother');
const logger = require('./logger');

const monitorMap = new Map();

module.exports.getReports = function() {
  let report = {};
  logger.info('Getting reports!');
  for (const [key, value] of monitorMap) {
    report[key] = value.getReport();
  }
  return report
}

module.exports.getDetailReports = function() {
  let report = {};
  logger.info('Getting reports!');
  for (const [key, value] of monitorMap) {
    report[key] = {
      report: value.getReport(),
      data: value
    };
  }
  return report
}

module.exports.clearReports = function() {
  logger.info('Clearing reports!');
  for (const value of monitorMap.values()) {
    value.clearReport();
  }
}

module.exports.getMonitors = function() {
  logger.system('Getting monitors!');
  return Array.from(monitorMap.keys());
}

module.exports.getMonitor = function(name, statusToMatch) {
  logger.info('Getting monitor: ' + name);
  if(!monitorMap.has(name)) {
    logger.info('Monitor doesnt exist, making it!');
    monitorMap.set(name, new littleBro(name, statusToMatch));
  }
  return monitorMap.get(name);
}
