'use strict';
module.exports = class AbstractParser extends require('events') {
    constructor() {
        super();
        this.type = 'abstract';
    }
    parse(data) {
        this.emit('done', null);
    }
}