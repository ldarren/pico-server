const
GET = 'SELECT key, val FROM map WHERE dataId=?;',
GET_VAL = 'SELECT val FROM map WHERE dataId=? AND key=?;',
GET_NEW = 'SELECT key, val FROM map WHERE dataId=? AND updatedAt > ?;',
GET_DATA_ID = 'SELECT dataId, key, val FROM map WHERE key=? AND val=?;',
GET_DATA_IDS = 'SELECT dataId, key, val FROM map WHERE ',
SET = 'INSERT INTO map (dataId, key, val, createdBy) VALUES ? ON DUPLICATE KEY UPDATE val=VALUES(val), updatedBy=VALUES(createdBy);'

var
common = require('../../../../lib/common'),
client, KEYS, IDS

module.exports = {
    setup: function(context, next){
        client = context.sqlTracker
        var k = require('./key')
        KEYS = k.keys()
        IDS = k.ids()
        next()
    },
    set: function(dataId, kv, by, cb){
        var keys = Object.keys(kv)
        if (!keys.length) return cb(null, [])
        var params = []
        for(var i=0,k; k=keys[i]; i++){
            params.push([dataId, IDS[k], kv[k], by])
        }
        client.query(SET, [params], cb)
    },
    get: function(dataId, cb){
        client.query(GET, [dataId], function(err, result){
            if (err) return cb(err)
            return (null, common.map(result, KEYS, 'key', 'val'))
        })
    },
    getVal: function(dataId, key, cb){
        client.query(GET_VAL, [dataId, IDS[key]], cb)
    },
    getNew: function(dataId, at, cb){
        client.query(GET_NEW, [dataId, at], function(err, result){
            if (err) return cb(err)
            return (null, common.map(result, KEYS, 'key', 'val'))
        })
    },
    getDataId: function(key, value, cb){
        client.query(GET_DATA_ID, [IDS[key], value], cb)
    },
    getDataIds: function(kv, cb){
        if (!(kv instanceOf Object)) return cb(null, [])
        var keys = Object.keys(kv)
        if (!keys.length) return cb(null, [])

        var
        tpl = [],
        params = []
        for(var i=0,k; k=keys[i]; i++){
            tpl.push('(key=? AND val=?)')
            params.push(IDS[k])
            params.push(kv[k])
        }
        client.query(GET_DATA_IDS+tpl.join(' OR ')+';', params, cb)
    }
}
