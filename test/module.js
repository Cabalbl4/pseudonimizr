const expect = require('chai').expect;
const assert = require('chai').assert;
describe('Module tests', function() {
    it('should follow interface', function() {
        const moduleExporter = (require('../index').standalone)();
        expect(moduleExporter.addDictionaryFromString).to.be.a('function');
        expect(moduleExporter.addDictionaryFromFile).to.be.a('function');
        expect(moduleExporter.process).to.be.a('function');
    });

});

describe('Dictionary tests', function(){
    const moduleExporter = (require('../index').standalone)({"fuzzyLevel":0, "treeRandomize" : false});
    it('should break on no dict present', function(done){
        expect(function(){
            moduleExporter.process('DE','html', '<html>TEST</html>').then((data) => {
                assert(false, 'Should not be here');
                done();
            }).catch(e => {
                console.log(e);
                expect(e).to.be.an('Error');
                done();
            });
        }).to.not.throw();

    });
    it('should accept dictionary from string', function(done) {
        const dictionary = 'notest\n';
        const html = '<html>TEST</html>';
        moduleExporter.addDictionaryFromString('DE', dictionary);
        expect(function(){
            moduleExporter.process('DE','html', html).then((data) => {
                console.log('DONE', data);
                expect(data).not.to.be.equal(html);
                done();
            }).catch(e => {
                console.log(e);
                expect(e).to.be.an('Error');
                assert(false, 'Should not be here');
                done();
            });
        }).to.not.throw();
    });


});