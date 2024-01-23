// All Demographics now done as part of the initial Ward List search
// const patients = require('./patient-data');
// const DP = require('./data_process');
// const demoAPI = require('./../api/demographics');
//
// const demographics = new DP('demographics', 0.5, async (args) => {
//  let limit = process.env.Patient_Limit ? process.env.Patient_Limit : -1;
//  if(!args || args.length == 0) {
// 	 demographics.warn('There are no patient mrns to process!');
// 	 return [];
//  }
//  let demoData = [];
//  for(let i = 0; i < args.length-1; i++) {
// 	 demographics.debug('Getting pid for mrn ' + JSON.stringify(args[i]));
//    const pid = await demoAPI.getPatientIdByMRN(args[i].mrn);
// 	 demographics.debug('Getting data for pid ' + pid);
// 	 let data = await demoAPI.getFullDataByPatientID(pid);
// 	 demographics.debug('Got demo data for ' + pid + ':');
// 	 demographics.debug(JSON.stringify(data));
// 	 data.pid = pid;
// 	 data.mrn = args[i].mrn;
// 	 demoData.push(data);
//  }
//  return demoData;
// }, [], true);
//
// module.exports = demographics;
