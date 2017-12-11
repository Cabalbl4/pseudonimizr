'use strict';

const config = require('./config');
const spawn = require('threads').spawn;
const fs = require('fs');
const langs = process.argv[2];
const mode = process.argv[3];
const input = process.argv[4];
const output = process.argv[5];
const processLangs = require('./helpers/processLangs');
const workLoadCoordinator = new (require('./workLoadCoordinator').WorkloadCoordinator)(config);
let promise = null;

if(langs.toUpperCase() === 'AUTO') {
    promise = workLoadCoordinator.guessLanguageFlow(mode, fs.readFileSync(input).toString('utf8'));
} else {
    promise = workLoadCoordinator.standardFlow(processLangs(langs), mode,  fs.readFileSync(input).toString('utf8'));
}

promise.then((contents) => {
    fs.writeFileSync(output, contents);
}).catch(e => console.error(e));