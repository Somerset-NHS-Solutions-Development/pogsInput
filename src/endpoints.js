const logger = require('./utils/logger');
const verifyToken = require('./handlers/verify-token');
const fs = require("fs");
const path = require("path");
const express = require('express');
const router = express.Router();
const wrangler = require('./processing/data_wrangler');
const utils = require('./utils/utils');
const util = require('util');

// Asynch Middleware
const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
};

// Not used for now
function getWardDataFromRequest(req) {
	let w = {
		forms: ''
	};
	for(let k in req.query) {
		if(req.query.hasOwnProperty(k)) {
			let lk = k.toLowerCase().trim();
			if(lk == 'tag') {
				w.tag = req.query[k];
				continue;
			}
			if(lk == 'ward') {
				w.name = req.query[k];
				continue;
			}
			if(lk == 'raw') {
				w.raw = req.query[k] == 'true';
			}
			if(lk == 'forms') {
				w.forms = req.query[k] == 'att';
			}
		}
	}
	return w;
}

const getGeneralData = async (req, res, next) => {
	logger.debug('general endpoint - all wards - all forms');

	const now = new Date();
	try {
		const data = await wrangler.getGeneralPatientDataAsJSON();
		res.status(200).json(data);
	} catch(ex) {
		logger.debug('Endpoint exception: ', ex);
		res.status(500).json({
			message: 'Server error',
			exception: ex
		});
	}

};

const getDashboardStats =  async (req, res, next) => {
	logger.debug('general endpoint - all ward - dashboard stats');

	const now = new Date();
	try {
		const data = await wrangler.getDashboardStatsAsJSON();
		res.status(200).json(data.data);
	} catch(ex) {
		logger.error('Endpoint exception: ', ex);
		res.status(500).json({
			message: 'Server error',
			exception: ex
		});
	}

};

const getSlowQueryResults =  async (req, res, next) => {
	logger.debug('general endpoint - slow query results');

	const now = new Date();
	try {
		const data = await wrangler.getSlowQueryResults();
		res.status(200).json(data);
	} catch(ex) {
		logger.error('Endpoint exception: ', ex);
		res.status(500).json({
			message: 'Server error',
			exception: ex
		});
	}

};

const getTraumaFormResults =  async (req, res, next) => {
	logger.debug('general endpoint - trauma query results');

	const now = new Date();
	try {
		const data = await wrangler.getTraumaFormResults();
		res.status(200).json(data);
	} catch(ex) {
		logger.error('Endpoint exception: ', ex);
		res.status(500).json({
			message: 'Server error',
			exception: ex
		});
	}
};

const getDemographicsByMRN =  async (req, res, next) => {
	logger.debug('demographics endpoint - trauma query results');

  if(!req.params || !req.params.mrn || req.params.mrn == '') {
      return res.status(400).json({
  			message: 'Missing MRN query parameter'
  		});
  }

	const now = new Date();
	try {
		const data = await wrangler.getDemographicsByMRNAsync(req.params.mrn);
    if(!data) {
      return res.status(404).json({
        message: 'Patient not found'
      });
    }

		res.status(200).json(data);
	} catch(ex) {
		logger.error('Endpoint exception: ', ex);
    res.status(500).json({
			message: 'Server error',
			exception: ex
		});
	}
};

const testEndpoint = async (req,res,next) => {
  logger.debug('testing endpoint');
	res.status(200).json({
		message: 'Test Endpoint Working'
	});
};

const lookupsEndpoint = async (req, res, next) => {
  logger.debug('lookups endpoint');
  const ret = {
    message: 'lookups',
    kvs: []
  };

  const keys = process.lookup_table.keys();
  for(let k of keys) {
    ret.kvs.push({
      key: k,
      value: process.lookup_table.get(k)
    });
  }

	res.status(200).json(ret);
};

const getHelp = async (req, res, next) => {
	return res.status(200).json({
			endpoints: [{
				address: 'test',
				description: 'An open test endpoint you can try to verify the service is running and configured.'
			},{
				address: 'securetest',
				description: 'As above but requires a bearer token. Used to test token validation'
			},{
				address: 'dashboard',
				description: 'Returns all patients and form data for all wards, in json format',
				queryparams: []
			},{
				address: 'slow',
				description: 'Returns slow query results (queries that execute no more than twice a day)',
				queryparams: []
			}
		]
	});
};

const start_time = new Date();
function getUptime() {
	return utils.getDateDiffInString(start_time.getTime(), Date.now());
}

// Routes

//Tests
router.get('/test', asyncMiddleware(testEndpoint));
router.get('/verifytest', verifyToken, asyncMiddleware(testEndpoint));
router.get('/lookups', asyncMiddleware(lookupsEndpoint));
router.get('/securetest', verifyToken, asyncMiddleware(testEndpoint));
router.get('/stats', verifyToken, asyncMiddleware((req, res, next) => {
	return res.status(200).json({
		uptime: getUptime(),
    start_date: start_time,
		data_gathering: wrangler.dataGatheringStatus()
	});
}));

//Data Caching
router.get('/data/status', verifyToken, asyncMiddleware((req, res, next) => {
	return res.status(200).json(wrangler.dataGatheringStatus());
}));

router.post('/data/start', verifyToken, asyncMiddleware((req, res, next) => {
	wrangler.startDataGathering();
	return res.status(200).json(wrangler.dataGatheringStatus());
}));

router.post('/data/stop', verifyToken, asyncMiddleware((req, res, next) => {
	wrangler.stopDataGathering();
	return res.status(200).json(wrangler.dataGatheringStatus());
}));

router.post('/data/unfail', verifyToken, asyncMiddleware((req, res, next) => {
	wrangler.clearFailedProcesses();
	return res.status(200).json(wrangler.dataGatheringStatus());
}));

router.post('/data/force', verifyToken, asyncMiddleware((req, res, next) => {
	wrangler.forceGeneralStats();
	return res.status(200).json();
}));

const getTFAs = async (req, res, next) => {
	logger.debug('getting all TFAs');

	const now = new Date();
	try {
		const data = await wrangler.getAllTFAs();
		res.status(200).json(data);
	} catch (ex) {
		logger.error('Endpoint exception: ', ex);
		res.status(500).json({
			message: 'Server error',
			exception: ex
		});
	}
};

const getDocs = async (req, res, next) => {
	logger.debug('getting all TFAs');

	const now = new Date();
	try {
		const data = await wrangler.getAllDocData();
		res.status(200).json(data);
	} catch (ex) {
		logger.error('Endpoint exception: ', ex);
		res.status(500).json({
			message: 'Server error',
			exception: ex
		});
	}
};

const getByTFA = async (req, res, next) => {
	logger.debug('getting doc by TFA');

	const now = new Date();
	try {
		const data = await wrangler.getDocDataByTFA(req.params.tfa);
		res.status(200).json(data);
	} catch (ex) {
		logger.error('Endpoint exception: ', ex);
		res.status(500).json({
			message: 'Server error',
			exception: ex
		});
	}
};

//Get Data Quick
router.get('/dashboard', verifyToken, asyncMiddleware(getDashboardStats));
router.get('/tfas', verifyToken, asyncMiddleware(getTFAs));
router.get('/docs', asyncMiddleware(getDocs));
router.get('/tfa/:tfa', verifyToken, asyncMiddleware(getByTFA));

router.use('/logs', require('./utils/logger-endpoints'));
router.use('/monitors', require('./utils/bigbrother-endpoints'));

// Catch All
router.get('/', asyncMiddleware(getHelp));

module.exports = router;
