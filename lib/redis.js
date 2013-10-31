// TODO: must contained pubsub communication channel, reuse pipeline feature?
var
redis = require('redis'),
onMessage = function(channel, msg){
    switch(msg){
    }
};

exports.init = function(appConfig, config, next){
    var client = redis.createClient(config.port, config.host, config.options);
    client.select(config.db);

    // node_redis handles reconnection only if error event is listened
    client.on('error', function(err){
        console.error('redis conn['+config.host+':'+config.port+'.'+config.db+'] error',err);
    });
    client.on('end', function(){
        console.error('redis conn['+config.host+':'+config.port+'.'+config.db+'] end');
    });
    client.on('reconnecting', function(){
        console.log('redis conn['+config.host+':'+config.port+'.'+config.db+'] reconnecting');
    });
    client.on('connect', function(){
        console.log('redis conn['+config.host+':'+config.port+'.'+config.db+'] connected');
        if (config.sub){
            client.subscribe(config.sub, onMessage);
        }
    });
    return next(null, client);
};
