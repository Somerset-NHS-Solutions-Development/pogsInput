module.exports = LittleBrother;

const logger = require('./logger');

const timespan_millis = 3600000 * process.env.BigBrother_LastHours;
const report_throttle_time = 60000 / process.env.BigBrother_ReportThrottleRate_PerMin;
logger.system('Report throttle of ' + process.env.BigBrother_ReportThrottleRate_PerMin +
  ' per min = 1 per ' + report_throttle_time + 'ms');
const status_length = parseInt(process.env.BigBrother_LastStatusCount.trim());
logger.system('Report status length: ' + status_length);
const use_sequential_matching = (process.env.BigBrother_UseSequentialMatchingRules.trim().toLowerCase() == 'true');
const sequential_success = Math.ceil(status_length * process.env.BigBrother_SuccessSequentialRatio);
const sequential_warning = Math.ceil(status_length * process.env.BigBrother_WarningSequentailRatio);
const sequential_fail = Math.ceil(status_length * process.env.BigBrother_FailSequentialRatio);
const sequential_max = parseInt(process.env.BigBrother_SequentialMax.trim());

function LittleBrother(name, statusToMatch) {
  logger.system('New monitor: ' + name + ', looking for status: ' + statusToMatch);
  this.name = name;
  this.status_to_match = statusToMatch;
  this.last_statuses = new Array(status_length);
  this.last_status_index = 0;
  this.last_timestamp = 0;
  this.sequential_matches = 0;
  this.sequential_fails = 0;
}

LittleBrother.prototype.report = function(status) {
  logger.debug('Monitor ' + this.name + ': ' + status + ', index: ' + this.last_status_index);
  const timestamp = new Date();
  if(this.last_timestamp < timestamp) {
    this.last_statuses[this.last_status_index++] = {
      timestamp: timestamp.getTime(),
      datetime: timestamp,
      status
    };

    // logger.system(this.name + ' Monitor: new status added: ' + JSON.stringify(this.last_statuses[this.last_status_index-1]));

    if(use_sequential_matching) {
      if(status == this.status_to_match) {
        this.sequential_matches++;
        this.sequential_fails = 0;
      } else {
        this.sequential_fails++;
        this.sequential_matches = 0;
      }

      if(this.sequential_matches > sequential_max) {
        this.sequential_matches = sequential_success+1;
      } else if(this.sequential_fails > sequential_max) {
        this.sequential_fails = sequential_fail+1;
      }
    }

    this.last_timestamp = timestamp.getTime() + report_throttle_time;

    if(this.last_status_index >= this.last_statuses.length) {
      this.last_status_index = 0;
    }
  }
}

LittleBrother.prototype.clearReport = function() {
  this.last_statuses = new Array(status_length);
  this.last_status_index = 0;
  this.sequential_fails = 0;
  this.sequential_success = 0;
}

LittleBrother.prototype.getReport = function() {
  let statusMatches = 0;
  let timeMatches = 0;
  let timespan = Date.now()-timespan_millis;
  let result = process.env.BigBrother_ResultNoData;

  for(let i = 0; i < this.last_statuses.length; i++) {
    if(this.last_statuses[i] != undefined) {
      if(this.last_statuses[i].timestamp > timespan) {
        timeMatches++;
        if(this.last_statuses[i].status == this.status_to_match) {
          statusMatches++;
        }
      }
    }
  }

  let test = 0;
  if(timeMatches > 0) {
    result = process.env.BigBrother_ResultFail;
    if(statusMatches > 0) {
      test = (statusMatches/timeMatches);
      if(test >= process.env.BigBrother_SuccessRate) {
        result = process.env.BigBrother_ResultSuccess;
      } else if (test >= process.env.BigBrother_WarningRate) {
        result = process.env.BigBrother_ResultWarning;
      }
    }
  }

  if(use_sequential_matching) {
    if(this.sequential_matches >= sequential_success) {
      result = process.env.BigBrother_ResultSuccess;
    } else if(this.sequential_matches >= sequential_warning) {
      result = process.env.BigBrother_ResultWarning;
    } else if(this.sequential_fails >= sequential_fail) {
      result = process.env.BigBrother_ResultFail;
    }
  }

  return {
    result: result,
    success_ratio: test,
    relevant_statuses: timeMatches,
    matching_statuses: statusMatches,
    sequential_matching: {
      enabled: use_sequential_matching,
      sequential_matches: this.sequential_matches,
      sequential_fails: this.sequential_fails
    }
  }
}
