'use strict';
const cheerio = require('cheerio');
const attributes = require('./skipHtmlAttributes');
const htmlIgnore = require('./htmlIgnore');
class HTMLParser extends require('../abstractParser') {
    constructor(anonimizer, options) {
        super();
        this.type = 'html';
        this.anonimizer = anonimizer;
        this.options = Object.assign({
            remove_js: false
        }, options);

    }

    _safeTranslate(phrase) {
        const subs = {};
        for(let word of htmlIgnore) {

            if(~phrase.indexOf(word)) {
                subs[word] = phrase.indexOf(word);
            }
        };

        let result = this.anonimizer.randomize(phrase);
        for(let word in subs) {
            let count = 0;
            let subres = ''
            for(let i=0; i< result.length; i++) {
                if(i >= subs[word] && i < subs[word] + word.length) {
                    subres += word[count];
                    count++;
                } else {
                    subres += result[i];
                }
            }
            result = subres;
        };

        return result;

    }

    parse(data) {
        //console.log(data);
        const $ = cheerio.load(data, {
            withDomLvl1: true,
            normalizeWhitespace: false,
            xmlMode: true,
            decodeEntities: false
        });
        $('*').each((index, node)=>{
            //console.log(node.type, node.data);
            for(var attr in node.attribs) {
                    if(!(~attributes.indexOf(attr))) {
                        const val = node.attribs[attr];
                        node.attribs[attr]= this.anonimizer.randomize(val);
                    };
            }

            node.children.filter((child)=>{
                if(child.data) {
                    if(child.type === 'text') {

                        if(this.options.remove_js && node.type === 'script') {
                            child.data = '/* REMOVED */';
                        } else {
                            child.data = this._safeTranslate(child.data);
                        }

                    }
                }

            });
        });
        this.emit('done', $.html());
    };
}
module.exports = HTMLParser;
