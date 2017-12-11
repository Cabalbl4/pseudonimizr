module.exports = function processLangs(langs) {
    if(typeof langs === 'string') {
        return langs.split(',');
    } 
    return langs;
}