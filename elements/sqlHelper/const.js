const READ = 'SELECT v, k FROM const WHERE status=1';

var
sc = require('pico-common'),
client, KEYS, VALS

module.exports = {
    setup: function(connClient, cb){
        client = connClient 
        client.query(READ, function(err, result){
            if (err) return cb(err)
            KEYS = sc.keyValues(result, 'v', 'k')
            VALS = sc.keyValues(result, 'k', 'v')
            cb()
        })
    },
    toKey: function(v){ return KEYS[v] },
    toVal: function(k){ return VALS[k] },
    keys: function(){ return KEYS },
    vals: function(){ return VALS }
}
