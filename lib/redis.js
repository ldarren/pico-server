// TODO: must contained pubsub communication channel, reuse pipeline feature?
var redis = require('redis');

var onMessage = function(channel, msg){
    switch(msg){
    }
}

exports.init = function(appConfig, libConfig, next){
    var client = redis.createClient();
    if (libConfig.sub){
        client.subscribe(libConfig.sub, onMessage);
    }
    return next(null, client);
};
