var
cluster = require('cluster'),
pico = require('pico'),
lone = require('./lone'),
cpuLen = require('os').cpus().length;

var
onMessage = function(){
},
onExit = function(){
};


cluster.on('exit', onExit);

for(var i=0; i<cpuLen; i++){
  cluster.fork().on('message', onMessage);
}
