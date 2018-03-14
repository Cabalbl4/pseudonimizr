
const reserved = require('./allreserved');

function indexes(source, find) {
    var result = [];
    for (i = 0; i < source.length; ++i) {
      if (source.substring(i, i + find.length) == find) {
        result.push(i);
      }
    }
    return result;
  }

class HBCIParser extends require('../abstractParser') {
    constructor(anonimizer) {
        super();
        this.type = 'hbci';
        this.anonimizer = anonimizer;
        
    }

    // Plain and simple
    parse(data) {
        const subset = reserved.filter((val) => ~data.indexOf(val));
        let substitute = {};
        subset.forEach(val => {
            substitute[val] = indexes(data, val);
        })
        let out = this.anonimizer.randomize(data);

        for(let sub in substitute) {
            let indexes = substitute[sub];
            for(let index of indexes) {
                    out = out.substr(0, index) + sub + out.substr(index + sub.length);
                    //console.log('replace', sub, index);
            }
        }
        //process.exit(0);
        this.emit('done', out);
    };
}
module.exports = HBCIParser;

