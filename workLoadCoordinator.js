const EducationWorker = require('./workers/educationWorker');

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
            worker.on('error', (err) => {
                reject(err);
            })
        });
    };





}

module.exports = WorkloadCoordinator;