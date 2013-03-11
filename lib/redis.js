var redis = require('redis');

exports.init = function(appConfig, libConfig, next){
    var client = redis.createClient();
    return next(null, client);
};
