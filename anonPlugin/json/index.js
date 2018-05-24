'use strict';

const sensetiveFieldSet =
[
    'pin',
    'salt',
    'password',
    'acctNo',
    ()=>/otp/gi,
    ()=>/id/gi,
    ()=>/iban/gi,
    // /name/gi,
    'senderName',
    'payeePayerName',
    'holderName',
    // ()=>/purpose/gi,
];

function checkSensetive(what) {
    for (let key of sensetiveFieldSet) {
        if (typeof key === 'function') {
            key = key();
        }
        if (typeof key === 'object' && key instanceof RegExp) {
            if (key.test(what)) {
                return true;
            }
        } else if (what === key)  {
            return true;
        }
    }
    return false;
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n); //eslint-disable-line
}

class JSONParser extends require('../abstractParser') {
    constructor(anonimizer) {
        super();
        this.type = 'json';
        this.anonimizer = anonimizer;
        
    }

    // Prepare for circular references ETC
    _ensureParsed(data) {
        if(typeof data === 'string') {
            return JSON.parse(data);
        } else {
            return JSON.parse(JSON.stringify(data));
        }
    }

    anon(data, isSensitive = false) {
        if (Array.isArray(data)) {
            return data.map(val => this.anon(val, isSensitive));
        } else if (data === null) {
            return null;
        } else if (typeof data === 'object') {
            const returnObj = {};
            for (let key of Object.keys(data)) {
                if (checkSensetive(key) || isSensitive) {
                    returnObj[key] = this.anon(data[key], true);
                } else {
                    returnObj[key] = this.anon(data[key], false);
                }
            }
            return returnObj;
        }
        // Be VERY strict with possible sensetive fields
        if (isSensitive) {
            if (isNumber(data)) {
                return parseFloat(('' + data).split('').map((val)=>{
                    if (val === ',' || val === '.') {
                        return val;
                    }
                    return 4; // chosen by fair dice roll. guarenteed to be random.
                }).join(''));
            } else if (typeof data === 'boolean') {
                return false;
            }
            return ('' + data).split('').map(() => '*').join('');
        } else if(typeof data === 'string') {
            return this.anonimizer.randomize(data);
        }
        return data;
    }

    parse(data) {
        try {
            const safeData = this._ensureParsed(data);
            this.emit('done', JSON.stringify(this.anon(safeData, false)));
        } catch(e) {
            this.emit('done', this.anonimizer.randomize('' + data));
        }
    };
}
module.exports = JSONParser;