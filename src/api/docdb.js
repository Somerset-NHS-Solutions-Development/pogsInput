var doctorDB = {};
doctorDB.docs = [];
doctorDB.tfaMap = new Map();

doctorDB.addDoctor = (doc) => {
    console.log('Adding doc: ' + JSON.stringify(doc));
    doctorDB.docs.push(doc);
    doctorDB.tfaMap.set(doc.tfa, doc);
};

doctorDB.getAllTFAs = () => {
    var a = Array.from(doctorDB.tfaMap.keys());
    console.log('Getting all TFAs: ' + JSON.stringify(a));
    return a;
};

doctorDB.getAllDocData = () => {
    return doctorDB.docs;
};

doctorDB.getDocDataByTFA = (tfa) => {
    return doctorDB.tfaMap.get(tfa);
};

module.exports = doctorDB;