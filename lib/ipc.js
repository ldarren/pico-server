// TODO: inter process communication channel, reuse pipeline feature

var
cluster = require('cluster'),
pipeline = [],
workers,
onMessage = function(msg){
};

cluster.on('fork', onMessage);
cluster.on('setup', onMessage);

cluster.on('disconnect', function(w) {
    w.destroy();
});

cluster.on('exit', function(w) {
    console.log('worker ' + w.id + ' died. restart...');

    cluster.fork();
});

exports.init = function(appConfig, libConfig, next){
    if (cluster.isMaster){
        workers = cluster.workers;
    }else{
        workers = [cluster.worker];
    }
    var w;
    for (var i=0, l=workers.length; i<l; i++){
        w = workers[i];
        w.on('message', onMessage);
        w.on('online', onMessage);
        w.on('listening', onMessage);
        w.on('disconnect', onMessage);
        w.on('exit', onMessage);
    }
    next();
};

exports.sendMessage = function(message, except){
    for(var i=0, l=workers.length; i<l; i++){
        workers[i].send(message);
    }
};
