# Pseudonimizr

## A tool to make smart anonimization.

This tool intelligently anonimizes data by matching the common used words in selected languages with ones given in input
This help to anonimize all the data which is sensetive, and leave common messages (Errors etc) untouched

## Disclaimer

This is a prototype. It can misbehave and ruin HTML/CSV structure, please check the output before processing it!

### Before you start

Populate *dicts/* folder with dictionaries (or specify path to them in `extraDicts`). 
Dictionary is a newline-separated list of words with the name of a country like DE, GB etc

### Requires

*Node.js must be >=v6!* 
This is due to:

* *cherio* html parser asks for it
* ~~JS v5, please die already~~


# Config

*config.json*
```
{
    // Fuzzy search level. Describes how much a given word can derive from its analogs. 0 - no fuzzy search, 1+ adds more fuzziness
    "fuzzyLevel" : 0,
    // Remove inline script instead of randomizing it
    "html_remove_script" : false,
    // Will use words from language instead of random sequences in substitution
    treeRandomize: true,
    // Extra path to search for dictionary files. All of them should exist at program start
    "extraDicts" : ["./path/to/extra/dictionaries", "another/path"],
    server: {
        // Port for service mode
        port: 7766
    }
}

```

# Usage as a module

Current module interface:
```
module.exports = {
    standalone: function() {},
    Service: null, //TODO
    ServiceConnector: null, // TODO
};
```

## Standalone usage

```
// This OPTIONAL config will override values of built-in config.json
const optionalConfig = {
    fuzzyLevel: 0
}

const pseudonimizr = require('pseudonimizr').standandalone(optionalConfig); // or just .standalone()

pseudonimizr.process('DE', 'html', '<html>TEST</html>').then((data) => {
    console.log('got anonimized string', data);
}).catch(e=>console.warn(e));

```

### Standalone interface functions and parameters

#### addDictionaryFromString(lang, stringData)
Add dictionary to memory from a newline separated string
```
pseudonimizr.addDictionaryFromString('RU', 'один\nдва\nтри\n....');
```
####  addDictionaryFromFile(lang, filePath)
Add dictionary from file. Same as `addDictionaryFromString`, but you specify a path as second parameter

#### process(langs, mode, input)
Main async function. Accepts:
##### langs
a string of comma-separated languages, or array of language strings, or 'AUTO' keyword, or undefined/null
```
'DE'
'DE,GB'
'DE,RU,CZ'
['NL','HU']
```

Null/undefined parameter or 'AUTO' keyword will launch function in language detect mode
##### mode
one of supported format modes. Currently supported are 'text', 'html', 'csv'. Must be explicitly one of those
##### input
utf8 text string with data needed to anonimize

This function returns a promise, which either gives anonimized string or is rejected with error

#### supportetDicts()
Show array of dictionaries currently available, like: `['DE','GB','ZZ']`



# Usage as stand-alone tool

From pseudonimizr folder

```
node tool.js LANGS format input output

```

*Where:*
* LANGS - comma separated list of one or more languages for this dump. Relevant dictionary must be present in dicts folder.
* format - format of input. Right now can be one of *csv*, *html*, *text*
* input - path to unput file
* output - path to output file

#### Examples

```
node tool.js DE html index.html anon-index.html
node tool.js DE,GB,ES csv data.csv anon-data.csv

```

Note. There is an empty dictionary *ZZ*. If you use it as the only language in LANGS, all words will be shredded regardless to their relevance

# Usage as a service

```
node service.js
```

Will listen to port, specified in config. Will keep dictionaries in cache for faster access.
### Requires:
#### Headers: 
**languages** - same as LANGS param, missing header will be treated as AUTO

**mode** - same as *format* param

Body is the desired data to anonimize

Successful call will return anonimised document and status 200;
Non 200 status means error (400 - bad parameters, 500 - other problems)
