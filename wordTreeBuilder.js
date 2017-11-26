'use strict';

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

class Branch {
    constructor(letter) {
        this.letter = letter;
        this.childs = {};
        Object.freeze(this);
    }
    
    _serialize() {
        let self = this;
        const result = {
            letter: self.letter,
            childs: {},
        };
        
        for(let letter in this.childs) {
          result.childs[letter] = this.childs[letter]._serialize();
        };
        
        return result;
    }
    
    match(wordPart) {
        if(wordPart === '') {
            return false;
        }
        if(wordPart[0] !== this.letter) {
            return false;
        }
        if(wordPart.length === 1) {
            return true;
        } else {
            const shortWord = wordPart.substring(1);
            for(let key in this.childs) {
                if(this.childs[key].match(shortWord)) {
                    return true;
                }
            }
            return false;
        }
        
    }
    
    walk(length, delim) {
        if(length === 1) return this.letter;
        const realChilds = Object.keys(this.childs).map(e => this.childs[e]).filter( child => child.letter !== delim );
        if(! realChilds.length) {
          return null;  
        } 
        
        shuffle(realChilds);
        for(let i=0; i<realChilds.length; i++) {
            let result = realChilds[i].walk(length - 1, delim);
            if(result !== null) {
                return this.letter + result;
            }
        };
      
        return null;
        
    };
    
    build(wordRemains) {
        const nextLetter = wordRemains[0];
        const wordPart = wordRemains.substring(1);
        let child = this.childs[nextLetter];
        if(! child) {
            child = new Branch(nextLetter);
            this.childs[nextLetter] = child;
        }
        if(wordPart.length) {
            child.build(wordPart);
        }
    };
}

Branch.fromSerialized = (jsonObj) => {
    const result = new Branch(jsonObj.letter);
    for(let letter in jsonObj.childs) {
      result.childs[letter] = Branch.fromSerialized(jsonObj.childs[letter]);   
    }
    return result;
};
    
class WordTreeBuilder {
    constructor() {
        this.forrest = {};
        this.delim = '\n';
        this.wordCount = 0;
    }
    
    serialize() {
        const self = this;
        const result = {
           forrest: {},
           delim: this.delim,
           wordCount: this.wordCount
        }; 
        
        for(let letter in this.forrest) {
           result.forrest[letter] =
            this.forrest[letter]._serialize();
        };
        
        return result;
    }
    
    propose(length) {
        const keys = Object.keys(this.forrest);
        
        if(length <= 0 || keys.length === 0) {
            return null;
        }
        
        const key = keys[Math.floor(Math.random() * keys.length)];
        return this.forrest[key].walk(length, this.delim);
        
    }
    
    add(word) {
        if(word.length === 0) {
            return;
        }
        this.wordCount++;
        word += this.delim;
        if(! this.forrest[word[0]]) {
           this.forrest[word[0]] = new Branch(word[0]);
        } 
        this.forrest[word[0]].build(word.substring(1));
    }
    match(word) {
        if(word.length === 0) {
            return true;
        }
        word += this.delim;
        if(! this.forrest[word[0]]) {
            return false;
        }
        return this.forrest[word[0]].match(word);
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

WordTreeBuilder.fromSerialized = (jsonObj) => {
    const result = new WordTreeBuilder();
    result.delim = jsonObj.delim;
    result.wordCount = jsonObj.wordCount;
    for(let letter in jsonObj.forrest) {
        result.forrest[letter] = new Branch.fromSerialized(jsonObj.forrest[letter]);
    };
    return result;
};

module.exports = WordTreeBuilder;
