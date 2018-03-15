const expect = require('chai').expect;
const assert = require('chai').assert;
describe('Module tests', function() {
    it('should follow interface', function() {
        const moduleExporter = (require('../index').standalone)();
        expect(moduleExporter.addDictionaryFromString).to.be.a('function');
        expect(moduleExporter.addDictionaryFromFile).to.be.a('function');
        expect(moduleExporter.process).to.be.a('function');
    });
    it('should fail on bad mode (format)', function(){
        const moduleExporter = (require('../index').standalone)();
        expect(function() {
            moduleExporter.process('ZZ','nonexistingformat', '<html>TEST</html>').then((data) => {
                assert(false, 'Should not be here');
                done();
            })
        }).to.throw('not supported');
    });
    it('should have built-in ZZ lang working', function(done){
        const moduleExporter = (require('../index').standalone)();
        const html = '<html>TEST</html>';
        expect(function(){
            moduleExporter.process('ZZ','html', html).then((data) => {
                expect(html).to.be.not.equal(data);
                done();
            }).catch(e => {
                console.log(e);
                setTimeout(()=>{
                    expect(e).to.be.a('null');
                    done();
                },0);
            });
        }).to.not.throw();

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
                expect(data).not.to.be.equal(html);
                done();
            }).catch(e => {
                expect(e).to.be.an('Error');
                assert(false, 'Should not be here');
                done();
            });
        }).to.not.throw();
    });


});


describe('extra folder for scripts in config', function() {
    it('should contain XX dict', function() {
        const moduleExporter = (require('../index').standalone)({"fuzzyLevel":0, "treeRandomize" : false, extraDicts: ['./test/dictsExtra']});
        expect(moduleExporter.supportetDicts()).to.contain('XX');
    });

    it('should fail on bad paths', function() {
        expect(function(){
            const moduleExporter = (require('../index').standalone)({"fuzzyLevel":0, "treeRandomize" : false, extraDicts: ['./INEXISTENTRELATIVEDIRECTORY']});
        }).to.throw();
    });

    it('should really use XX dict from extra folder', function(done) {
        const moduleExporter = (require('../index').standalone)({"fuzzyLevel":0, "treeRandomize" : false, extraDicts: ['./test/dictsExtra']});
        const html = '<html>TESTING</html>';
        moduleExporter.process('XX','html', html).then((data) => {
            expect(data).not.to.be.equal(html);
            done();
        }).catch(e => {
            expect(e).to.be.an('Error');
            assert(false, 'Should not be here');
            done();
        });
    });

});