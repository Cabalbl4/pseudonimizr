// Pre-educated tree cache
const CONFIG = Object.freeze(require('./config'));
const SERVER_CONFIG = Object.freeze(CONFIG.server);
const server = require('express')();
const LoadCoordinator = require('./workLoadCoordinator').WorkloadCoordinator;
const workLoadCoordinator = new LoadCoordinator(CONFIG);
const mimeByMode = Object.freeze({
  'html' : 'text/html',
  'text' : 'text/plain',
  'csv' : 'text/csv',
});


function rawBody(req, res, next) {
  req.setEncoding('utf8');
  req.rawBody = '';
  req.on('data', function(chunk) {
    req.rawBody += chunk;
  });
  req.on('end', function(){
    next();
  });
}

server.use(rawBody);

server.post('/', function (req, res, next) {
  const data = req.rawBody || '';
  const languages = req.get('languages');
  const mode = req.get('mode');

  if(Object.keys(mimeByMode).indexOf(mode) === -1) {
    console.log('No such mode:' + mode);
    res.status(400);
    res.send('No such mode:' + mode);
    return;
  }

  let promise = null;

  if(!languages || (''+languages).toUpperCase() == 'AUTO') {
    promise = workLoadCoordinator.guessLanguageFlow(mode, data);
  } else {
    let secureRegex = /[^a-zA-Z\d\s,:]/g;
    if(secureRegex.test(languages)) {
      console.log('BAD languages:' + languages);
      res.status(400);
      res.send('BAD languages:' + languages);
      return;
    }

    const langsArray = languages.replace(' ', '').toUpperCase().split(',');
    promise = workLoadCoordinator.standardFlow(langsArray, mode, data);
  }

  
  promise.then((result) => {
    res.status(200);
    res.setHeader('Content-Type', mimeByMode[mode]);
    //console.log('PSEUDONIMIZED', data,result)
    res.send(result);
  }).catch((err) => {
    console.log(err);
    res.status(500);
    res.send('ERROR!');
  })

});

server.listen(SERVER_CONFIG.port, function () {
  console.log('Server listening on port ' + SERVER_CONFIG.port);
});
