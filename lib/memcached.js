var
memcached = require('memcached'),
serverInfo = function(details){
    return 'memcached server['+details.server+':'+details.tokens+'] info['+details.messages.join(' ')+']'
}

exports.init = function(appConfig, config, next){
    var client = new memcached(config.servers, config.options)
    client.get('@@'+config.container)

    // node_memcached handles reconnection only if error event is listened
    client.on('issue', function(issue){
        console.log(serverInfo(details),'is having at issue')
    })
    client.on('failure', function(details){
        console.log(serverInfo(details),'total failures:',details.totalFailures,'remain attempts',details.failures)
    })
    client.on('reconnecting', function(details){
        console.log(serverInfo(details),'is connecting')
        client.get('@@'+config.container)
    })
    client.on('reconnected', function(details){
        console.log(serverInfo(details),'has been reconnected')
    })
    client.on('remove', function(details){
        console.log(serverInfo(details),'has been removed')
    })
    return next(null, client)
}
