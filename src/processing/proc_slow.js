const DP = require('./data_process');
const FP = require('./../api/forms_processor');
const ehr = require('../api/ehr');

const fq_rieForms = new FP('rie_forms', 'ried_forms.aql', (data) => {
	console.log('Returning data: ' + (data ? data.length : 'No Data!'))
	return data;
});

const rieForms = new DP('rie_forms', -1, async (args) => {
	const date = new Date();
	date.setHours(date.getHours() - 36);
	const sDate = date.getUTCFullYear() + '-' +
        ('' + (date.getUTCMonth() + 1)).padStart(2, '0')  + '-' +
        ('' + date.getUTCDate()).padStart(2, '0') + 'T' +
        ('' + date.getUTCHours()).padStart(2, '0') + ':' +
        ('' + date.getUTCMinutes()).padStart(2, '0') + ':' +
        ('' + date.getUTCSeconds()).padStart(2, '0');
	const form_data = await fq_rieForms.callAQLWithReplacementsAsync(['<date>'], [sDate], true);
	for(let i = 0; i < form_data.length; i++) {
		form_data[i].full_form_name = form_data[i].form_name;
		const f = process.lookup_table.get(form_data[i].form_name);
		form_data[i].form_name = f ? f : form_data[i].form_name;
		form_data[i].deletion_info = await ehr.getFormDeletionInfo(form_data[i].ehr_id, form_data[i].composition_uid);
		slow_process.error('Form deletion error: ' + JSON.stringify(form_data[i].deletion_info))
	}
	return form_data;
});

const slowProcesses = [rieForms];

const slow_process = new DP('slow_processing',
	process.env.PROCESSING_INTERVAL_SLOW_HOURS*60,
	async (args) => {
		let slow = {};
		// slow_process.debug('Executing slow queries');
		for(let s of slowProcesses) {
			slow_process.debug('Getting data for ' + s.proc_name);
			slow[s.proc_name] = await s.getDataAsync();
			slow[s.proc_name] = slow[s.proc_name].data;
			slow_process.system('Data: ' + JSON.stringify(slow[s.proc_name], null, 4));
			s.startProcess();
			slow_process.debug('All done! ' + slow[s.proc_name].length + ' items');
		}
		return slow;
	});

module.exports = slow_process;
