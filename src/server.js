// custom-env wouldn't load direct from NODE_ENV for some reason
let prod = true;
if(process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === 'production') {
	require('custom-env').env('production');
} else {
	require('custom-env').env('development');
	prod = false;
}

const logger = require('./utils/logger');

logger.system('Still have old variables? ' + process.env.listenOn + ' port');

logger.system(`Running in ${process.env.NODE_ENV} mode!`);

logger.system('Running on ' + process.env.host);

// Express HTTP server
const express = require('express');
const server = express();
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');

if (!('toJSON' in Error.prototype))
Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
        var alt = {};

        Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
        }, this);

        return alt;
    },
    configurable: true,
    writable: true
});



//Setup CORS
let corsOptions = {};
if(process.env.corsEnabled.toLowerCase() === 'true'){
	let whitelist = [];
	if((process.env.allowedOrigins).includes(',')) {
		(process.env.allowedOrigins).split(',').forEach(function (item) {
			whitelist.push(item.trim());
		});
	} else {
		whitelist.push(process.env.allowedOrigins);
	}

	logger.system('Current acceptable CORS addresses: ' + whitelist)
	corsOptions = {
	  origin: function (origin, callback) {
			console.log('origin: ', origin);
			const index = whitelist.findIndex((w) => {
				return origin && origin.startsWith(w);
			})

			if (index > -1) {
				callback(null, true);
			} else {
				callback(new Error('CORS failed'));
			}
	  }
	}
}



// Middleware

server.use(cors(corsOptions));
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: false}));

const nocache = require('nocache');
server.use(nocache());
server.set('etag', false);


// router
const endpoints = require("./endpoints");

server.use('/', endpoints);

server.listen(process.env.listenOn, prod ? 'localhost' : null, () => {
	logger.system('Platform: '+process.platform);
	logger.system('Listening on port '+process.env.listenOn);
});
