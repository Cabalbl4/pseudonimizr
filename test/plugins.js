const expect = require('chai').expect;
const assert = require('chai').assert;
describe('Plugins tests', function() {
    const moduleExporter = (require('../index').standalone)();
    it('should anonimize html', function(done){
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

    it('should anonimize plain', function(done){
        const text = 'asasdsadsd 123123123 aadasdad';
        expect(function(){
            moduleExporter.process('ZZ','text', text).then((data) => {
                expect(text).to.be.not.equal(data);
                expect(data.length).to.equal(text.length);
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

    it('should anonimize json', function(done){
        const json = '{"foo":"bar"}';
        expect(function(){
            moduleExporter.process('ZZ','json', json).then((data) => {
                try {
                    expect(json).to.be.not.equal(data);
                    expect(data.length).to.equal(json.length);
                    expect(function(){
                        JSON.parse(data);
                    }).to.not.throw();
                } catch(e) {
                    return done(e);
                }
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

    it('should anonimize json - fallback in case of bad data', function(done){
        const json = 'fdsdl;dfksl;fkfsd;l';
        expect(function(){
            moduleExporter.process('ZZ','json', json).then((data) => {
                try {
                    expect(json).to.be.not.equal(data);
                    expect(data.length).to.equal(json.length);
                    expect(function(){
                        JSON.parse(data);
                    }).to.throw();
                } catch(e) {
                    return done(e);
                }
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



