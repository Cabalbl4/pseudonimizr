'use strict';

const config = require('./config');
const spawn = require('threads').spawn;
const fs = require('fs');
const languages = process.argv[2];
const dataFormat = process.argv[3];
const input = process.argv[4];
const output = process.argv[5];

const languageThread = () => spawn(function(input, done) {
  const WordTreeBuilder = require(input.__dirname+'/wordTreeBuilder');
  const Randomizer = require(input.__dirname+'/randomizers');
  const fs = require('fs');
  const currentTree = new WordTreeBuilder();
  let activeReaders = 0;
  input.languages.split(',').forEach((lang)=>{
    activeReaders++;
    var lineReader = require('readline').createInterface({
                input: require('fs').createReadStream(input.__dirname+'/dicts'+require('path').sep+lang)
            });
    
    lineReader.on('line', function (line) {
                const word = line.replace(' ', '').replace('\n','').replace('\r','').toUpperCase();
                currentTree.add(word);
            });
    
   lineReader.on('close', ()=>{
                activeReaders--;
                if(activeReaders !==0) return;
                const rnd = new Randomizer(currentTree, { maxBias: input.config.fuzzyLevel, treeRandomize : input.config.treeRandomize });
                let anon = null;
                if(input.dataFormat === 'html') {
                    anon = new (require(input.__dirname+'/anonPlugin/html'))(rnd, { remove_js: input.config.html_remove_script });
                } else if(input.dataFormat === 'csv' || input.dataFormat === 'text') {
                    anon =  new (require(input.__dirname+'/anonPlugin/plain'))(rnd);
                }
                anon.on('done', (data)=>{
                    done({ data : data, score: rnd.languageAffinity, language: lang });
                });
                anon.parse(fs.readFileSync(input.input).toString('utf8'));
            });//on close
  });//For each
});


if(languages.toUpperCase() === 'AUTO') {
    let results = [];
    fs.readdir('dicts', (err, files) => {
        let threads = 0;
        files.forEach(file => {
            threads++;
            if(file[0] !== '.') {
                const thr = languageThread();
                thr
                .send({
                    input: input,
                    languages: file,
                    dataFormat: dataFormat,
                    config: config,
                    __dirname:__dirname
                })  .on('message', function(response) {
                        console.log('Done', response.language, response.score);
                        threads--;
                        thr.kill();
                        results.push(response);
                        if(threads === 0) {
                          results.sort((a,b) => { return b.score - a.score });  
                          console.log(`Writong output for language with best score (${results[0].score}): ${results[0].language}`);
                          fs.writeFileSync(output, results[0].data);
                        };
                       
                    })
                    .on('error', function(error) {
                        console.error('Worker errored:', error);
                    })
                    .on('exit', function() {
                        console.log('Worker has been terminated.');
                    }); 
            };
        });
})
    
} else {
    const thr = languageThread();
    thr.send({
                    input: input,
                    languages: languages,
                    dataFormat: dataFormat,
                    config: config,
                    __dirname:__dirname
                    }).on('message', function(response) {
                        fs.writeFileSync(output,response.data);
                        thr.kill();
                    })
                    .on('error', function(error) {
                        console.error('Worker errored:', error);
                    })
                    .on('exit', function() {
                        console.log('Worker has been terminated.');
                    }); 
};//else


