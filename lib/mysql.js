//TODO: use pool or clusterPool to prevent connection error?
var
mysql = require('mysql'),
makeConn = function(client){
    var conn = mysql.createConnection(client.config);
    conn.on('error', function(err){
        console.error('mysql conn error', err);
        if ('PROTOCOL_CONNECTION_LOST' === err.code){
            process.nextTick(function(){
                makeConn(client);
            });
        }
    });
    conn.connect(function(err){
        if (err) return console.error('mysql conn[',client.config.host,'] error[',err,']');
        console.log('mysql conn[',client.config.host,'] connected');
    });
    client.conn = conn;
},
createClient = function(config){
    var client = {
        config: config,
        conn: null,
        query: function(){
            this.conn.query.apply(this.conn, arguments);
        }
    };
    makeConn(client);
    return client;
};

exports.init = function(appConfig, libConfig, next){
    return next(null, createClient({
        host     : libConfig.host,
        port     : libConfig.port,
        user     : libConfig.username,
        password : libConfig.password,
        database: libConfig.db,
    }));
};
