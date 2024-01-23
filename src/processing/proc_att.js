const FORMS = require('./../api/forms');
const FP = require('./../api/forms_processor');
const DP = require('./data_process');


const formsArray = [
	// Test
	// new FP('Any Form', 'any.aql', (form) => {
	// 	return {
	// 		form_name: 'any',
	// 		form_data: {
	// 			form_name: 'Anything!',
	// 			form_id: form.cuid,
	// 			recorded_date: form.completed,
	// 			patient_mrn: form.mrn
	// 		}
	// 	};
	// }),
	new FP('ATT', 'latest_att.aql', (form) => {
		return {
			form_name: 'acute_take_tracker',
			form_data: form
		};
	})
];

const formsAPI = new FORMS(formsArray);

const forms = new DP('att_forms', process.env.PROCESSING_INTERVAL_ATT_MINS,
async (args) => {
	if(!args || args.length == 0) {
		forms.warn('There are no patient mrns to process!');
		return [];
	}

	forms.debug('Getting att forms for ' + args.length + ' mrns');
	const formData =  await formsAPI.getLatestFormDataForPatientsAsync(args);

	return formData;
});


module.exports = forms;
