const fs = require('fs');
const EducationWorker = require('./workers/educationWorker');
const AnonimizationWorker = require('./workers/anonimizationWorker');

class WorkloadCoordinator {
    constructor(config) {
        this.treeCache = {};
        this.options = config;
    }

    /**
     * Ger educted tree from cache or educate on spot
     * @param {Array} langArray - array of lang strings ['DE', 'HU', 'GB', 'RU'...]
     * @return {Promise} promise to get tree if local files exist
     */
    getTree(langArray) {
        return new Promise((resolve, reject) => {
            const hash = langArray.sort().join('|').toUpperCase();
            if(this.treeCache[hash]) {
                resolve(this.treeCache[hash]);
                return;
            }
            //Educate new tree
            const worker = new EducationWorker(langArray);
            worker.on('done', (tree) => {
                this.treeCache[hash] = tree;
                resolve(tree);
            });
            worker.on('error', reject)
        });
    };

    _getSupportedDictsArray() {
        fs.readdirSync('./dicts');
        const result = [];
            files.forEach(file => {
                threads++;
                if(file[0] !== '.') {
                    result.push(file);
                }});
        return result;
    }

    pseudonimize(tree, mode, input) {
        return new Promise((resolve, reject) => {
            const worker = new AnonimizationWorker(tree, this.options, mode);
            worker.on('done', resolve);
            worker.on('error', reject);
            worker.parse(input)
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
        return new Promise((resolve, reject) => {
            const allLangs = this._getSupportedDictsArray();
            let runners = 0;
            let bestScore = 0;
            let dataTotal = '';
            for(lang in allLangs) {
                let runner = new Promise((resolve, reject)=>{
                    runners++;
                    this.getTree(langs).then((tree) => {
                        this.pseudonimize(tree, mode, input).then((data) => {
                            runners--;
                            if(data.score > bestScore) {
                                bestScore = data.score;
                                dataTotal = data.data;
                            }
                            if(runners === 0) {
                                resolve(dataTotal);
                            }
                        }).catch(reject);
                                }).catch(reject);
        
                });
    
    
            };
        });

    }

}

module.exports = WorkloadCoordinator;