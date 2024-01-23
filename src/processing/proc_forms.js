const FORMS = require('./../api/forms');
const FP = require('./../api/forms_processor');
const DP = require('./data_process');


const formsArray = [
	new FP('ATT', 'att.aql', (form) => {
		return {
			form_name: 'acute_take_tracker',
			form_data: form
		};
	}),
	new FP('About Me', 'about_me.aql', (form) => {
		return {
			form_name: 'about_me',
			form_data: {
				"form_name": "About Me",
				"form_id": form.cuid,
				"recorded_date": form.completed,
				"patient_mrn": form.mrn,
				"communication": {
					"assessment": {
						"findings": form.com_assessment_findings,
						"other": form.com_assessment_other
					},
					"action": {
						"comment": form.con_action_comment
					}
				},
				"personal_hygiene": {
					"assessment": {
						"findings": form.hyg_assessment_finding,
						"other": form.hyg_assessment_other,
						"comment": form.hyg_assessment_comment
					},
					"action": {
						"package_of_care": form.hyg_action_package,
						"assistance_of": form.hyg_action_assisstance,
						"comment": form.hyg_action_comment
					}
				},
				"nutrition_and_hydration": {
					"assessment": {
						"findings": form.nut_assessment_findings,
						"diabetes_type": form.nut_assessment_diabetes,
						"other": form.nut_assessment_other,
						"comment": form.nut_assessment_comment
					},
					"action": {
						"diet_levels": form.nut_action_diet,
						"fluid_levels": form.nut_action_fluid,
						"actions": form.nut_action_actions,
						"comment": form.nut_action_comment
					}
				},
				"sleep_and_rest": {
					"assessment": {
						"findings": form.sleep_assessment_finding,
						"other": form.sleep_assessment_other,
						"comment": form.sleep_assessment_comment
					},
					"action": {
						"actions": form.sleep_action_action,
						"comment": form.sleep_action_comment
					}
				},
				"elimination": {
					"assessment": {
						"findings": form.elim_assessment_findings,
						"other": form.elim_assessment_other,
						"comment": form.elim_assessment_comment
					},
					"action": {
						"actions": form.elim_action_actions,
						"comment": form.elim_action_comment
					}
				},
				"pain": {
					"assessment": {
						"findings": form.pain_assessment_findings,
						"other": form.pain_assessment_other,
						"comment": form.pain_assessment_comment
					},
					"action": {
						"actions": form.pain_action_actions,
						"comment": form.pain_action_comment
					}
				},
				"breathing_and_circulation": {
					"assessment": {
						"findings": form.breath_assessment_findings,
						"other": form.breath_assessment_other,
						"comment": form.breath_assessment_comment
					},
					"action": {
						"actions": form.breath_action_action,
						"comment": form.breath_action_comment
					}
				}
			}
		};
	}),
	new FP('High Risk', 'high_risk.aql', (form) => {
		// logger.debug('High Risk Processing form: ' + form.cuid);
		return {
			form_name: 'high_risk',
			form_data: form
		};
	}),
	new FP('Bed Rails', 'bed_rails.aql', (form) => {
		return {
			form_name: 'bed_rails',
			form_data: form
		};
	}),
	new FP('Body Map', 'body_map.aql', (form) => {
		return {
			form_name: 'body_map',
			form_data: form
		};
	}),
	new FP('Core Care Plan', 'core_care_plan.aql', (form) => {
		return {
			form_name: 'core_care_plan',
			form_data: form
		};
	}),
	new FP('Diabetic Foot Assessment', 'diabetic_foot.aql', (form) => {
		return {
			form_name: 'diabetic_foot',
			form_data: form
		};
	}),
	new FP('Waterlow', 'waterlow.aql', (form) => {
		// forms.system('Forms content: ' + JSON.stringify(form));
		return {
			form_name: 'waterlow',
			form_data: {
				"form_id": form.cuid,
				"recorded_date": form.created,
				"patient_mrn": form.mrn,
				"Nutritional_Risk": {
					"Weight": {
						"magnitude": form.Weight ? form.Weight.magnitude : null,
						"units": form.Weight ? form.Weight.units : null
						},
					"Height": {
						"magnitude": form.Height ? form.Height.magnitude : null,
						"units": form.Height ? form.Height.units : null
						},
					"BMI": {
						"magnitude": form.BMI ? form.BMI.magnitude : null,
						"units": form.BMI ? form.BMI.units : null
						},
					"Build_weight_for_height":form.Build_weight_for_height,
					"WeightLossScore": form.Nutritional_risk_Weight_loss
				},
				"Skin_type":{
					"Skin_type_Healthy": form.Skin_type_visual_risk_areas_Healthy,
					"Skin_type_Tissue_paper": form.Skin_type_visual_risk_areas_Tissue_paper,
					"Skin_type_Dry": form.Skin_type_visual_risk_areas_Dry,
					"Skin_type_Oedematous": form.Skin_type_visual_risk_areas_Oedematous,
					"Skin_type_Clammy_pyrexia": form.Skin_type_visual_risk_areas_Clammy_pyrexia,
					"Skin_type_Discoloured_Category_1": form.Skin_type_visual_risk_areas_Discoloured_Category_1,
					"Skin_type_Pressure_ulcer_Stage_2_4": form.Skin_type_visual_risk_areas_Pressure_ulcer_Stage_2_4,
					"Skin_type_Broken_spots_Category_2_4": form.Skin_type_visual_risk_areas_Broken_spots_Category_2_4
				},
				"Tissue_malnutrition":{

					"Tissue_malnutrition_Terminal_cachexia":form.Tissue_malnutrition_Terminal_cachexia,
					"Tissue_malnutrition_Single_organ_failure_respiratory_renal_cardiac_liver":form.Tissue_malnutrition_Single_organ_failure_respiratory_renal_cardiac_liver,
					"Tissue_malnutrition_Multiple_organ_failure":form.Tissue_malnutrition_Multiple_organ_failure,
					"Tissue_malnutrition_Peripheral_vascular_disease":form.Tissue_malnutrition_Peripheral_vascular_disease,
					"Tissue_malnutrition_Anaemia":form.Tissue_malnutrition_Anaemia,
					"Tissue_malnutrition_Smoking":form.Tissue_malnutrition_Smoking
				},
				"Neurological_deficit":{
					"Neurological_deficit_Diabetes_MS_CVA":form.Neurological_deficit_Diabetes_MS_CVA,
					"Neurological_deficit_Motor_sensory_deficit":form.Neurological_deficit_Motor_sensory_deficit,
					"Neurological_deficit_Paraplegia":form.Neurological_deficit_Paraplegia,
					"Neurological_deficit_Combined_neurological_deficit":form.Neurological_deficit_Combined_neurological_deficit
				},
				"Major_surgery_or_trauma":{
					"Major_surgery_or_trauma_Orthopaedic_spinal": form.Major_surgery_or_trauma_Orthopaedic_spinal,
					"Major_surgery_or_trauma_duration_of_surgery":form.Major_surgery_or_trauma_duration_of_surgery,
					"Major_surgery_or_trauma_Major_Surgery_Or_Trauma_In_The_Last_48_Hours":form.Major_surgery_or_trauma_Major_Surgery_Or_Trauma_In_The_Last_48_Hours
				},
				"Medication":{
					"Medication_Cytotoxics":form.Medication_Cytotoxics,
					"Medication_Steroids":form.Medication_Steroids,
					"Medication_Anti_inflammatories":form.Medication_Anti_inflammatories,
					"Medication_Combined_medication_risk":form.Medication_Combined_medication_risk
				},
				"Sex_Age":{
					"sex":form.sex,
					"age_group":form.age_group,
				},
				"Continence":form.Continence,
				"Mobility":form.Mobility,
				"Scoring_and_Grading":{
					"Waterlow_score":form.waterlow_score,
					"Overall_risk_grade":form.overall_risk_grade,
					"ScoringComment":form.scoring_comment
				}
			}
		};
	}),
	new FP('MUST', 'must.aql', (form) => {
		return {
			form_name: 'must',
			form_data: {
				"form_id": form.cuid,
				"recorded_date": form.completed,
				"patient_mrn": form.mrn,
				"scores": {
					"bmi": form.bmi_score,
					"weight_loss": form.weight_loss_score,
					"niades": form.niade_score,
					"total": form.total_score
				},
				"risk": form.risk
			}
		};
	}),
	new FP('Falls Assessment', 'falls.aql', (form) => {
		return {
			form_name: 'falls',
			form_data: {
				"form_id": form.cuid,
				"recorded_date": form.completed,
				"patient_mrn": form.mrn,
				"risks": {
					"over_65": form.over_65,
					"fallen_in_last_year": form.last_year,
					"believe_at_risk": form.belief,
					"confused": form.confused,
					"overall_risk": form.over_65 || form.last_year || form.belief || form.confused
				}
			}
		};
	}),
	new FP('Moving and Handling', 'moving.aql', (form) => {
		// logger.debug('Moving form: ' + form.cuid);
		return {
			form_name: 'moving_and_handling',
			form_data: form
		};
	}),
	new FP('VTE - Veneous Thromboembolism', 'vte.aql', (form) => {
		return {
			form_name: 'vte',
			form_data: form
		};
	}),
];

const formsAPI = new FORMS(formsArray);

const forms = new DP('forms', process.env.PROCESSING_INTERVAL_FORMS_MINS,
async (args) => {
	if(!args || args.length == 0) {
		forms.warn('There are no patient mrns to process!');
		return [];
	}
	forms.debug('Getting forms for ' + args.length + ' mrns');
	return await formsAPI.getLatestFormDataForPatientsAsync(args);
});

module.exports = forms;
