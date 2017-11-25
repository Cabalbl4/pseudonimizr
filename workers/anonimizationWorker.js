const spawn = require('threads').spawn;

class AnonimizationWorker extends require('events') {
    constructor(educatedWordTree, options, mode) {
        super();
        this.wordTree = educatedWordTree;
        this.options = options;
        this.mode = mode;
        this.runner = null;
    }

    onDone(anonDataWithScore) {
       this.runner.kill();
       console.log('anon', anonDataWithScore);
        this.emit('done', anonDataWithScore);
    }

    onError(e) {
        this.runner.kill();
        console.log(e);
        this.emit('error', e);
    }

    parse(what) {
        this._what = what;
        this._run();
    }

    _run() {
        if(this.runner) {
            throw new Error('Runner in progress');
        }

        this.runner = (() => spawn(function(input, done) {
            const mode = input.mode;
            const dir = input.dir;
            const Randomizer = require(input.dir+'/../randomizers');
            const WordTreeBuilder = require(input.dir+'/../wordTreeBuilder');
            const rand = new Randomizer(WordTreeBuilder.fromSerialized(input.wordTree), { 
                maxBias: input.options.fuzzyLevel, 
                treeRandomize : input.options.treeRandomize });
            let plugin = null;
            switch(mode) {
                case 'html':
                    plugin = new (require(input.dir + '/../anonPlugin/html'))(rand, { remove_js: input.config.html_remove_script });
                break;
                case 'csv':
                case 'text':
                    plugin = new (require(input.dir + '/../anonPlugin/plain'))(rand);
                break;
                default:
                    throw new Error('Unknown format mode: '+ mode);
            }

            plugin.on('done', (data)=>{
                done({ data : data, score: rand.languageAffinity });
            });
            plugin.parse(input.what);
            
        }))();

        this.runner.send({
            dir: __dirname,
            wordTree: this.wordTree.serialize(),
            options: this.options,
            mode: this.mode,
            what: this._what
          })
          .on('message', this.onDone.bind(this))
          .on('error', this.onError.bind(this))
         
          .on('exit', ()=>{
            console.log('AnonimizationWorker done');
            this.runner = null;
          })
    }
}

module.exports = AnonimizationWorker;