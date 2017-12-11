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
       // console.log('anon', anonDataWithScore);
        this.emit('done', anonDataWithScore);
    }

    onError(e) {
        this.runner.kill();
        // console.log(e);
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
                case input.MODES.HTML:
                    plugin = new (require(input.dir + '/../anonPlugin/html'))(rand, { remove_js: input.options.html_remove_script });
                break;
                case input.MODES.CSV:
                case input.MODES.TEXT:
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
            what: this._what,
            MODES: AnonimizationWorker.MODES
          })
          .on('message', this.onDone.bind(this))
          .on('error', this.onError.bind(this))
         
          .on('exit', ()=>{
            // console.log('AnonimizationWorker done');
            this.runner = null;
          })
    }
}

AnonimizationWorker.MODES = Object.freeze({
    HTML: 'html',
    CSV: 'csv',
    TEXT: 'text',
})

module.exports = AnonimizationWorker;