const READ = 'SELECT id, k FROM hash WHERE status=1';

var
sc = require('pico-common').obj,
Hash= function(){}

module.exports = Hash

Hash.prototype = {
    setup: function(client, cb){
        client.query(READ, function(err, result){
            if (err) return cb(err)
            this.KEYS = sc.keyValues(result, 'id', 'k')
            this.VALS = sc.keyValues(result, 'k', 'id')
            cb()
        })
    },
    toKey: function(v){ return this.KEYS[v] },
    toVal: function(k){ return this.VALS[k] },
    keys: function(){ return this.KEYS },
    vals: function(){ return this.VALS }
}
