const DP = require('./data_process');
const { parse } = require('csv-parse');
const fs = require('fs');
const path = require('path');
const { finished } = require ('stream/promises');

var processed = {
    files: [],
    docs: []
};

var tfaCount = 1;
const getNewTFA = () => {
    return 'AAAA' + (tfaCount++);
}

const processFile = async (filePath) => {
    const records = [];
    const parser = fs
        .createReadStream(filePath)
        .pipe(parse({}));

    parser.on('readable', function () {
        let record; while ((record = parser.read()) !== null) {
            // Work with each record
            records.push(record);
        }
    });
    await finished(parser);
    return records;
};

const parseFile = async (filePath) => {
    var rows = [];

    const data = await processFile(filePath);
    filesProc.info('Got Rows: ' + JSON.stringify(data));

    if(data && data.length > 1) {
        for(var i = 1; i < data.length; i++)
        {
            var doc = {
                gnc: data[i][0],
                first: data[i][1],
                middle: data[i][2],
                last: data[i][3],
                natno: data[i][4],
                dob: data[i][5],
                tfa: getNewTFA()
            };
            filesProc.system('Added TFA: ' + doc.tfa);
            rows.push(doc);
        }
    }    
    return rows;
};

const filesProc = new DP('filesProc', process.env.PROCESSING_INTERVAL_FILES_IN_MINS,
    async (args) => {
        filesProc.debug('Checking for new files to parse...');
        var processed = {
            files:[],
            docs:[]
        }

        filesProc.debug('args in: ' + JSON.stringify(args))
        if (args && args.ready && args.ready.length > 0) {
            filesProc.info('Files to Process...' + args.ready.length);
            for (let i = 0; i < args.ready.length; i++) {
                filesProc.info('Processing file: ' + args.ready[i].name);
                var docData = await parseFile(args.ready[i].proc_path);
                for (const doc of docData) {
                    filesProc.info('Doc data: ' + JSON.stringify(doc))
                    processed.docs.push(doc);
                }
                processed.files.push(args.ready[i]);
            }
        }
        return processed;
    });

module.exports = filesProc;