const spawn = require('threads').spawn;

/**
 * Educates tree from array of languages
 * 
 * @class EducationWorker
 * @constructor
 * @argument {Array} languagesArray array of strings like 
 * [ 'DE', 'HU', 'RU', 'GB' ] etc.
 * Also, languages array can contain pre-read dictionaries as strings:
 * ['DE', { code: 'GB' , data: 'raw dict string' }]
 * 
 * @argument {Array of strings} extraLanguagesPaths - use those optional path alongside of ./dicts
 * Only absolute paths are accepted!
 * Emits:
 * done + WordTree
 * error + Error
 */

class EducationWorker extends require('events') {
  constructor(languagesArray, extraLanguagesPaths) {
     super();
     this.languages = languagesArray;
     this.runner = null;
     this.extraLanguagesPaths = extraLanguagesPaths || [];
  }

  onDone(wordTreeSerialized) {
  //  console.log(this, this.runner)
      // this.runner.kill();
      // console.log('Education done');
      this.emit('done', wordTreeSerialized);
  }

  onError(err) {
      // console.log('Worker error, terminating');
      // this.runner.kill();
      // console.log(err);
      this.emit('error', err);
  }

  run() {
    // console.log('run!')


    if(this.runner) {
      throw 'runner in progress!'
    };
    
    this.runner = (() => (function(input) {
        // console.log('Education runner')
        new Promise((done, error)=>{
        const fs = require('fs');
        const path = require('path');
        const WordSetHolder = require(input.dir+'/../wordSetHolder');
        const currentTree = new WordSetHolder();
        const allPaths = [input.dir+'/../dicts'].concat(input.extraDictPaths);
        function detectPath(lang) {
          for(let testPath of allPaths) {
            if (fs.existsSync(testPath + lang)) {
              return testPath + lang
            }
            if (fs.existsSync(testPath + path.sep + lang)) {
              return testPath + path.sep + lang;
            }
          };
          throw new Error('Can not find dictionary:' + lang)
        };




        let activeReaders = 0;
        for(let lang of input.langs) {
            activeReaders++;      
              if(typeof lang === 'string') {    
                  const lineReader = require('readline').createInterface({
                      input: require('fs').createReadStream(detectPath(lang))
                  });

                lineReader.on('line', function (line) {
                            const word = line.replace(' ', '').replace('\n','').replace('\r','').toUpperCase();
                            currentTree.add(word);
                        });

                lineReader.on('close', ()=>{
                            activeReaders--;
                            // console.log("Active readers", activeReaders)
                            if(activeReaders !==0) {
                              return;
                            };
                            done(currentTree);
                        });//on close
              } else {
                // Parse pre-read dictionary
                // Must not be sync - all readers should start!
                setTimeout(()=>{
                  const dataArray = lang.data.split('\n');
                  for(let strInput of dataArray) {
                    currentTree.add(strInput);
                  }
                  activeReaders--;
                  if(activeReaders !== 0) {
                    return;
                  };
                  done(currentTree);
                },0);
              } // if
          }
        }).then(this.onDone.bind(this)).catch(this.onError.bind(this));
    }))();

    this.runner({
      dir: __dirname,
      langs: this.languages,
      extraDictPaths: this.extraLanguagesPaths,
    })
  }
};

module.exports = EducationWorker;