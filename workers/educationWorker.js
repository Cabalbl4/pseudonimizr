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
     super();
     this.languages = languagesArray;
     this.runner = null;
  }

  onDone(wordTreeSerialized) {
  //  console.log(this, this.runner)
      this.runner.kill();
      console.log('Education done');
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
    console.log('run!')


    if(this.runner) {
      throw 'runner in progress!'
    };
    
    this.runner = (() => spawn(function(input, done) {
        console.log('Education runner')
        const WordTreeBuilder = require(input.dir+'/../wordTreeBuilder');
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
                    console.log("Active readers", activeReaders)
                    if(activeReaders !==0) {
                       return;
                    };
                    done(currentTree.serialize());
                });//on close
          }
    }))();

    this.runner.send({
      dir: __dirname,
      langs: this.languages
    })
    .on('message', this.onDone.bind(this))
    
    .on('error', this.onError.bind(this))
    
    .on('exit', ()=>{
      console.log('EducationWorker done');
      this.runner = null;
    })
  }
};

module.exports = EducationWorker;