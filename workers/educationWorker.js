const spawn = require('threads').spawn;

/**
 * Educates tree from array of languages
 * 
 * @class EducationWorker
 * @constructor
 * @argument {Array} languagesArray array of strings like 
 * [ 'DE', 'HU', 'RU', 'GB' ] etc.
 * Emits:
 * done + WordTree
 * error + Error
 */

class EducationWorker extends require('events') {
  constructor(languagesArray) {
     this.languages = languagesArray;
     this.runner = null;
  }

  onDone(wordTreeSerialized) {
      this.runner.kill();
      this.emit('done', require('../wordTreeBuilder')
          .fromSerialized(wordTreeSerialized));
  }

  onError(err) {
      console.log('Worker error, terminating');
      this.runner.kill();
      console.log(err);
      this.emit('error', err);
  }

  run() {
    if(this.runner) {
      throw 'runner in progress!'
    };

    this.runner = spawn(function(input, done) {
        const WordTreeBuilder = require(input.dir+'../wordTreeBuilder');
        const currentTree = new WordTreeBuilder();
        let activeReaders = 0;
        for(let lang of input.langs) {
          activeReaders++;          
          const lineReader = require('readline').createInterface({
              input: require('fs').createReadStream(input.dir+'/../dicts'+require('path').sep+lang)
          });

        lineReader.on('line', function (line) {
                    const word = line.replace(' ', '').replace('\n','').replace('\r','').toUpperCase();
                    currentTree.add(word);
                });

        lineReader.on('close', ()=>{
                    activeReaders--;
                    if(activeReaders !==0) {
                       return;
                    };
                    done(currentTree.serialize());
                });//on close
          }
    });

    this.runner().send({
      dir: __dirname,
      langs: this.languages
    }).on('error', this.onError)
    .on('message', this.onDone)
    .on('exit', ()=>{
      console.log('Worker done');
      this.runner = null;
    })
  }
};

module.exports = EducationWorker;