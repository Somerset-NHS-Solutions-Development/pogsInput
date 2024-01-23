module.exports.getDateDiffInString = function (a, b) {
	let mills = Math.abs(a - b);
	let days = 0, hours = 0, minutes = 0, seconds = 0;

	while(mills > 86400000) {
		days++;
		mills -= 86400000;
	}

	while(mills > 3600000) {
		hours++;
		mills -= 3600000;
	}

	while(mills > 60000) {
		minutes++;
		mills -= 60000;
	}

	while(mills > 1000) {
		seconds++;
		mills -= 1000;
	}

	return `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
}
