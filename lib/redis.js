// TODO: must contained pubsub communication channel, reuse pipeline feature?
var redis = require('redis');

var onMessage = function(){
}

exports.init = function(appConfig, libConfig, next){
    var client = redis.createClient();
    if (libConfig.res){
        client.subscribe(libConfig.res, onMessage);
    }
    return next(null, client);
};
