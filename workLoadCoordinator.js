const fs = require('fs');
const EducationWorker = require('./workers/educationWorker');
const AnonimizationWorker = require('./workers/anonimizationWorker');
const fullPathExtract = require('./helpers/fullPathExtract');
const WordSetHolder = require('./wordSetHolder');
const path = require('path');
const MAX_WORKERS = require('os').cpus().length;
const logging = require('./logging');
const logger = () => { return logging.getLogger() };

class PreReadDictionary extends WordSetHolder {
    constructor(lang, data = '') {
        super();
        if(data && (typeof data !== 'string')) {
            throw new Error('Data should be string!');
        }
        if(typeof lang !== 'string' || lang.length !== 2) {
            throw new Error('Language code should be string with length of 2!');
        }
        this.lang = lang;
        this.set = new Set(data.split('\n'));
    }
}

PreReadDictionary.fromFile = (lang, filePath, encoding) => {
    return new PreReadDictionary(lang, fs.readFileSync(filePath, encoding || 'utf8') );
}

class WorkloadCoordinator {
    constructor(config) {
        this.treeCache = {};
        this.options = config;
        
        // Dictionaries provided by external program.
        this.extraDictPaths = fullPathExtract(config.extraDicts || []);
        this.blackListPaths = fullPathExtract(config.blackLists || []);
        this._getTreeRequests = {};
        this.__workerCount = 0;
        this.blacklist = this.__educateBlacklist(this.blackListPaths);
        logger().log('WorkloadCoordinator initialized');
    }

    __educateBlacklist(paths) {
        let resultArr = [];
        logger().log('Populating cross-language blacklist');
        for(let dpath of paths) {
            for(let file of fs.readdirSync(dpath)) {
                const blackListFile = path.join(dpath, file);
                logger().log(`Adding ${blackListFile} to blacklist`);
                let lines = fs.readFileSync(blackListFile, 'utf-8')
                .split('\n');
                resultArr = resultArr.concat(lines);
            }
        }
        return WordSetHolder.fromSerialized(resultArr);
    }
    
    supportedModes() {
        return Object.keys(AnonimizationWorker.MODES).map(key =>  AnonimizationWorker.MODES[key]);
    }

    addDictionary(preReadDictionary) {
        if(! (preReadDictionary instanceof PreReadDictionary) ) {
            throw new Error('This function accepts only class PreReadDictionary');
        };
        this.treeCache[preReadDictionary.lang] = preReadDictionary;
    };

    /**
     * Ger educted tree from cache or educate on spot
     * @param {Array} langArray - array of lang strings ['DE', 'HU', 'GB', 'RU'...]
     * @return {Promise} promise to get tree if local files exist
     */
    getTree(langArray) {
        // logger().log('getTree')
        return new Promise((resolve, reject) => {
            const hash = langArray.sort().join('|').toUpperCase();
            if(this.treeCache[hash]) {
                return resolve(this.treeCache[hash]);
            }

            if(! this._getTreeRequests[hash]) {
                this._getTreeRequests[hash] = [];
            }

            this._getTreeRequests[hash].push(resolve);
            if(this._getTreeRequests[hash].length > 1) {
                return;
            } 

            //Replace already read langs with stored ones
            const preparedLangsArr = langArray;

            let hit = 0;
            let educateLater = () => {
                if(this.__workerCount > MAX_WORKERS) {
                    logger().log('Worker limit hit, delaying education!');
                    hit += 1;
                    return setTimeout(educateLater, hit * 1000);
                }
                this.__workerCount += 1;
                //Educate new tree
                const worker = new EducationWorker(preparedLangsArr, this.extraDictPaths);
                worker.on('done', (tree) => {
                    this.__workerCount -= 1;
                    this.treeCache[hash] = tree;
                    this._getTreeRequests[hash].forEach(func => func(tree));
                });
                worker.on('error', (err) => { this.__workerCount -= 1; reject(err);});
                worker.run();
            }
            educateLater();
        });
    };

    getSupportedDictsArray() {
        let files = fs.existsSync(path.join(__dirname,'/dicts')) ? fs.readdirSync(path.join(__dirname,'/dicts')) : [];
        for(let pathExtra of this.extraDictPaths) {
            files = files.concat(fs.readdirSync(pathExtra))
        }
        const result = [];
            files.forEach(file => {
                if(file[0] !== '.') {
                    result.push(file);
                }});
        for(let extraLang of Object.keys(this.treeCache)) {
            result.push(extraLang);
        }
        return result;
    }

    pseudonimize(tree, mode, input) {
        const self = this;
        return new Promise((resolve, reject) => {
            function anonLater() {
                if(self.__workerCount >= MAX_WORKERS) {
                   // logger().log('Worker max count hit. Delaying anonimization process...')
                    return setTimeout(anonLater, 5000);
                }
                logger().log('Dispatch anonimization process...')
                self.__workerCount += 1;
                const worker = new AnonimizationWorker(tree, self.blacklist, self.options, mode);
                worker.on('done', (result) => {self.__workerCount -= 1; resolve(result)});
                worker.on('error',  (result) => {self.__workerCount -= 1; reject(result)});
                //logger().log("ITYPE" ,typeof input)
                worker.parse(input);
            };
            anonLater();
        });
    }

    standardFlow(langs, mode, input) {
        return new Promise((resolve, reject)=>{
            this.getTree(langs).then((tree) => {
                this.pseudonimize(tree, mode, input).then((data) => {
                    resolve(data.data);
                }).catch(reject);
                        }).catch(reject);

        });
    }

    guessLanguageFlow(mode, input) {
        logger().log('guess language');
        return new Promise((resolve, reject) => {
            const allLangs = this.getSupportedDictsArray();
            let runners = 0;
            let bestScore = -1;
            let dataTotal = '';
            let winnerLang = '';
            for(let lang of allLangs) {
               // let runner = new Promise((resolve, reject)=>{
                    runners++;
                    this.getTree([lang]).then((tree) => {
                        
                        this.pseudonimize(tree, mode, input).then((data) => {
                            runners--;
                            if(data.score > bestScore) {
                                bestScore = data.score;
                                dataTotal = data.data;
                                winnerLang = lang;
                            }
                            if(runners === 0) {
                                logger().log(`Detected best lang: ${winnerLang}`);
                                resolve(dataTotal);
                            }
                        }).catch((e)=>{
                            logger().log(e);
                            reject(e);
                        });
                                }).catch((e)=>{
                                    logger().log(e);
                                    reject(e);
                                });
        
                //});
    
    
            };
        });

    }

}

module.exports = { WorkloadCoordinator, PreReadDictionary }
