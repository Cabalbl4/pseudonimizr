# Pseudonimizr

## A tool to make smart anonimization.

This tool intelligently anonimizes data by matching the common used words in selected languages with ones given in input
This help to anonimize all the data which is sensetive, and leave common messages (Errors etc) untouched

## Disclaimer

This is a prototype. It can misbehave and ruin HTML/CSV structure, please check the output before processing it!

### Before you start

Populate *dicts/* folder with dictionaries. 
Dictionary is a newline-separated list of words with the name of a country like DE, GB etc


### Requires

*Node.js must be >=v6!* 
This is due to:

* *cherio* html parser asks for it
* ~~JS v5, please die already~~

## Usage

From pseudonimizr folder

```
node index.js LANGS format input output

```

*Where:*
* LANGS - comma separated list of one or more languages for this dump. Relevant dictionary must be present in dicts folder.
* format - format of input. Right now can be one of *csv*, *html*, *text*
* input - path to unput file
* output - path to output file

#### Examples

```
node index.js DE html index.html anon-index.html
node index.js DE,GB,ES csv data.csv anon-data.csv

```

Note. There is an empty dictionary *ZZ*. If you use it as the only language in LANGS, all words will be shredded regardless to their relevance

## Config

*config.json*
```
{
    // Fuzzy search level. Describes how much a given word can derive from its analogs. 0 - no fuzzy search, 1+ adds more fuzziness
    "fuzzyLevel" : 0,
    // Remove inline script instead of randomizing it
    "html_remove_script" : false,
    // Try only those languages for auto-detect. At least one should be present
    "autoDetectableLanguages" : ["DE","GB","HU" ...]
}

```
