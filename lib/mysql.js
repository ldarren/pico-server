var
mysql = require('mysql'),
makeConn = function(client){
    var conn = mysql.createConnection(client.config);
    conn.on('error', function(err){
        console.error('mysql conn error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST'){
            makeConn(client);
        }
    });
    conn.connect();
    client.conn = conn;
},
createClient = function(config){
    var client = {
        config: config,
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
        user     : libConfig.username,
        password : libConfig.password,
        database: libConfig.db,
    }));
};
