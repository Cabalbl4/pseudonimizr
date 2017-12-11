const PreReadDictionary = require('./workLoadCoordinator').PreReadDictionary;
const processLangs = require('./helpers/processLangs');

// This file wraps pseudonimizr to be used as node.js module
function initStandalone(optionalConfig) {
    const CONFIG = Object.assign({}, require('./config'), optionalConfig);
    // console.log('USE CONFIG', CONFIG);
    // This instance stores all caches
    const workLoadCoordinator = new (require('./workLoadCoordinator').WorkloadCoordinator)(CONFIG);

    
    return {
        addDictionaryFromString(lang, stringData) {
            workLoadCoordinator.addDictionary(new PreReadDictionary(lang, stringData));
        },
        addDictionaryFromFile(lang, filePath) {
            workLoadCoordinator.addDictionary(PreReadDictionary.fromFile(lang, filePath));
        },
        process(langs, mode, input) {
            const processed =  processLangs(langs);
            if(!(~workLoadCoordinator.supportedModes().indexOf(mode))) {
                throw new Error( `Mode '${mode}' not supported. List of supported modes '${ workLoadCoordinator.supportedModes().join(',') }'` );
            };
            // Return a promise to return a string
            if((! langs) || langs === 'AUTO') {
                return workLoadCoordinator.guessLanguageFlow(mode, input);
            } else {
                return workLoadCoordinator.standardFlow(processed, mode, input);
            }
        },
        supportetDicts() {
            return workLoadCoordinator.getSupportedDictsArray();
        }
    };
}

module.exports = initStandalone;