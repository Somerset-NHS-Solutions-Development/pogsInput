const express = require('express');
const router = express.Router();
const verifyToken = require('./../handlers/verify-token');

const bb = require('./bigbrother');

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
};

router.delete('/', verifyToken, asyncMiddleware((req, res, next) => {
  bb.clearReports();
  res.json(bb.getReports());
}));

router.get('/', verifyToken, asyncMiddleware((req, res, next) => {
  res.json(bb.getReports());
}));

router.get('/list', verifyToken, asyncMiddleware((req, res, next) => {
  res.json(bb.getMonitors());
}));

router.get('/details', verifyToken, asyncMiddleware((req, res, next) => {
  res.json(bb.getDetailReports());
}));

router.get('/:name/details', verifyToken, asyncMiddleware((req, res, next) => {
  if(!req.params['name']) {
    return res.status(400).json({
      message: 'No monitor name provided'
    });
  }

  let m = bb.getMonitor(req.params['name']);
  if(!m) {
    return res.status(400).json({
      message: 'Bad monitor name provided'
    });
  }

  res.json({
    report: m.getReport(),
    data: m
  });
  
  next();
}));

router.get('/:name', verifyToken, asyncMiddleware((req, res, next) => {
  if(!req.params['name']) {
    return res.status(400).json({
      message: 'No monitor name provided'
    });
  }

  let m = bb.getMonitor(req.params['name']);
  if(!m) {
    return res.status(400).json({
      message: 'Bad monitor name provided'
    });
  }

  res.json(m.getReport());
  next();
}));

module.exports = router;
