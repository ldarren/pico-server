const READ = 'SELECT `id`, `key` FROM `key` WHERE `status`=1';

var
common = require('../../../../lib/common'),
client, KEYS, IDS

module.exports = {
    setup: function(context, next){
        context.sqlTracker.query(READ, function(err, result){
            if (err) return next(err)
            KEYS = common.keyValues(result, 'id', 'key')
            IDS = common.keyValues(result, 'key', 'id')
            next()
        })
    },
    toKey: function(id){ return KEYS[id] },
    toId: function(key){ return IDS[key] },
    keys: function(){ return KEYS },
    ids: function(){ return IDS }
}
