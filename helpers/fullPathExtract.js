const path = require('path');
const fs = require('fs');

/**
 * Check paths existence and convert them to absolute ones
 * 
 * @param {Array of strings} shortDictsArray array of paths (relative or absolute)
 * @returns {Array of strings} set of existing absolute paths
 * @throws {Error} if one of the paths is not existing
 */
module.exports = function checkAndConvertToAbsolute(shortDictsArray) {
    shortDictsArray = shortDictsArray || [];
    const result = [];
    for(let subPath of shortDictsArray) {
        let pathConverted = '';
        if(path.isAbsolute(subPath)) {
            pathConverted = subPath;
        } else {
            pathConverted = path.resolve(subPath);
        }
        if(! fs.lstatSync(pathConverted).isDirectory()) {
            throw new Error(`${pathConverted} is not a directory!`);
        }
        result.push(pathConverted);
    };
    return result;
}