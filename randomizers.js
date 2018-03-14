'use strict';
const currencies = ['$', '₠','₡','₢','₣','₤','₥','₦','₧','₨',
'₩','₪','₫','€','₭','₮','₯','₰','₱','₲','₳','₴','₵','₶','₷',
'₸','₹','₺','₻','₼','₽','₾','₿'];
const special = ['\'','"','.',',','!','+','-','{','}','[',']','(',')',
':',';','<','>','?','/','\\','@','#','%','№','^','*','~','§','&','`',
'|','=','–','_'
]
const spacers = ['\n','\r',' ','\t'];

class BiasedSequenceRandomizer {
    constructor(educatedWordTree, educatedBlacklist, options) {
        this.bias = {};
        this.maxBias = options.maxBias;
        this.treeRandomize = options.treeRandomize;
        this.tree = educatedWordTree;
        this.blacklist = educatedBlacklist;
        this.languageAffinity = 0;
    }

    _biasedRandomize(phrase) {
        if(Object.hasOwnProperty(this.bias[phrase])) return this.bias[phrase];

        const prev = Object.keys(this.bias);
        for(let key of prev) {
            if(phrase === key) {
                return this.bias[key];
            }
            if(phrase.length >= key.length) {
                const pos = phrase.indexOf(key);
                if(pos != -1) {
                    let result = '';
                    for(let i=0; i<phrase.length; i++) {
                        if((i>=pos) && (i<(pos+key.length))) {
                        result += this.bias[key][i - pos]
                        } else {
                        result += this._randomizeANChar(phrase[i]);
                        }
                    };
                    this.bias[phrase] = result;
                    return result;
                }
            } else {
                const pos = key.indexOf(phrase);
                let result = '';
                if(pos != -1) {
                    for(let i=0; i<phrase.length; i++) {
                        result += this.bias[key][i+pos];
                    }
                    this.bias[phrase] = result;
                    return result;
                }

            }

        };

        if(isNaN(phrase) && this.treeRandomize) {
          let substitute = this.tree.propose(phrase.length);
          if(substitute !== null) {
             let result = '';
             for(let i=0; i<phrase.length; i++) {
                 let letter = phrase[i];
                 if(letter === letter.toUpperCase()) {
                   result += substitute[i].toUpperCase()
                 } else {
                   result += substitute[i].toLocaleLowerCase();
                 }
             };
             this.bias[phrase] = result;
             return result;
          };


        };

        // Unable to find a word in vocab, or is number
        let result = '';
        for(let i=0; i<phrase.length; i++) {
            result += this._randomizeANChar(phrase[i]);
        }
        this.bias[phrase] = result;
        return result;
    };

    _isSep(char) {
        if(~currencies.indexOf(char)) return true;
        if(~special.indexOf(char)) return true;
        if(~spacers.indexOf(char)) return true;
        return false;
    }
    _randomizeANChar(char) {
        if(this._isSep(char)){
            return char;
        }

        const nonAN = /[^1-9a-zA-Z\d\s:\u00C0-\u00FF]/g;
        if(nonAN.test(char)){
            return char;
        }
        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        if(isNaN(char)) {
            if(char.toUpperCase() === char) {
                return alphabet[Math.floor(Math.random() * alphabet.length)].toUpperCase();
            } else {
                return alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        } else {
            return Math.floor(Math.random()*10)
        }
    }

    fuzzyMatch(what) {
        if(this.blacklist.fuzzyMatch(what.toUpperCase() ,this.maxBias)) {
            return false;
        }
        if(this.tree.fuzzyMatch(what.toUpperCase(), this.maxBias)) {
            return true;
        }

        return false;
    }


    randomize(sequence) {
        if(sequence.length === 0) {
            return '';
        }

        let phrase = null;
        let number = null;
        let result = '';
        for(let i=0; i < sequence.length; i++) {
            if(this._isSep(sequence[i])) {
                if(phrase) {

                    if(this.fuzzyMatch(phrase)) {
                        this.languageAffinity += phrase.length;
                        //console.log(phrase);
                        result += phrase;
                    } else {
                        result += this._biasedRandomize(phrase)
                    }
                    phrase = null;
                } else if(number) {
                    result += this._biasedRandomize(number);
                    number = null;
                }

                result += sequence[i];
            } else if (!isNaN(sequence[i])){
                if(phrase) {
                   if(this.fuzzyMatch(phrase)) {
                       //console.log(phrase);
                       this.languageAffinity += phrase.length;
                       result += phrase;
                    } else {
                        result += this._biasedRandomize(phrase);
                    }
                    phrase = null;
                }
                number = number ? number + sequence[i] : sequence[i];
            } else {

                if(number)  {
                    result += this._biasedRandomize(number);
                    number = null;
                }
                phrase = phrase ? phrase + sequence[i] :sequence[i];
            }
        };

        if(phrase) {
                   if(this.fuzzyMatch(phrase)) {
                       //console.log(phrase);
                       this.languageAffinity += phrase.length;
                       result += phrase;
                    } else {
                        result += this._biasedRandomize(phrase);
                    }
                    phrase = null;
                }
                if(number)  {
                    result += this._biasedRandomize(number);
                    number = null;
                }


        return result;
    };

}

module.exports = BiasedSequenceRandomizer;
