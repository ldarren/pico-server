//TODO: use pool or clusterPool to prevent connection error?
var
mysql = require('mysql'),
makeConn = function(client){
    var
    config = client.config,
    conn = mysql.createConnection(config)
    conn.on('error', function(err){
        console.error('mysql conn error', err)
        if ('PROTOCOL_CONNECTION_LOST' === err.code){
            setImmediate(function(){ makeConn(client) })
        }
    })
    conn.connect(function(err){
        if (err) {
            setImmediate(function(){ makeConn(client) })
            return console.error('mysql conn[',JSON.stringify(config),'] error[',err,']')
        }
        console.log('mysql conn['+config.host+':'+config.port+'.'+config.database+'] connected')
        //conn.query('SET NAMES utf8');
    })
    client.conn = conn
},
createClient = function(config){
    var client = {
        config: config,
        conn: null,
        query: function(){
            this.conn.query.apply(this.conn, arguments)
        }
    }
    makeConn(client)
    return client
}

exports.init = function(appConfig, libConfig, next){
    return next(null, createClient(libConfig))
}
