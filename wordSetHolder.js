const logging = require('./logging');
const logger = () => { return logging.getLogger() };
class WordSetHolder {
    constructor() {
        this.set = new Set();
    }
    
    serialize() {
        return Array.from(this.set);
    }

    propose(length) {
        for(let value of this.set.values()) {
            if(value.length === length) {
                //console.log('Propose', value);
                return value;
            }
        } 
        return null;
    }
    
    add(word) {
        if(word.length === 0) {
            return;
        }
        this.wordCount++;
        this.set.add(word.toUpperCase());
    }
    match(word) {
        if(word.length === 0) {
            return true;
        }
        return this.set.has(word.toUpperCase());
    }
    fuzzyMatch(word, offset) {
        if(this.match(word)) {
            return true;
        }
        for(var i=1; i<=offset; i++) {
            if(
                this.match(word.substring(i))||
                this.match(word.substring(0, word.length - 1))
            ) return true;
        }
        return false;
    };
    
} 

WordSetHolder.fromSerialized = (arr) => {
    const result = new WordSetHolder();

    result.set = new Set(arr);
    logger().log('Set deserialized. Contains words:', result.set.size);
    return result;
};

module.exports = WordSetHolder;