// Pre-educated tree cache
const inMemoryCache = {}; 
const CONFIG = Object.freese(require('./config').server);
const server = require('express')();

server.get('/', function (req, res) {
  res.send('Hello World!');
});

server.listen(CONFIG.port, function () {
  console.log('Server listening on port ' + CONFIG.port);
});
