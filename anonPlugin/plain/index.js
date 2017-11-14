'use strict';

class PlainParser extends require('../abstractParser') {
    constructor(anonimizer) {
        super();
        this.type = 'plain';
        this.anonimizer = anonimizer;
        
    }

    // Plain and simple
    parse(data) {
        this.emit('done', this.anonimizer.randomize(data));
    };
}
module.exports = PlainParser;
