const READ = 'SELECT v, k FROM const WHERE status=1';

var
sc = require('pico-common'),
client, KEYS, VALS

module.exports = {
    setup: function(context, next){
        context.sqlTracker.query(READ, function(err, result){
            if (err) return next(err)
            KEYS = sc.keyValues(result, 'v', 'k')
            VALS = sc.keyValues(result, 'k', 'v')
            next()
        })
    },
    toKey: function(v){ return KEYS[v] },
    toVal: function(k){ return VALS[k] },
    keys: function(){ return KEYS },
    vals: function(){ return VALS }
}
