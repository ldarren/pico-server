const
GET = 'SELECT `key`, `val` FROM `map` WHERE `dataId`=? AND `key` NOT IN (?);',
GET_VAL = 'SELECT * FROM `map` WHERE `dataId`=? AND `key`=?;',
GET_VALS = 'SELECT * FROM `map` WHERE `dataId`=? AND `key` IN (?);',
GET_MULTI_VAL = 'SELECT * FROM `map` WHERE `dataId` IN (?) AND `key`=?;',
GET_MULTI_VALS = 'SELECT * FROM `map` WHERE `dataId` IN (?) AND `key` IN (?);',
GET_NEW = 'SELECT `key`, `val` FROM `map` WHERE `dataId`=? AND `key` NOT IN (?) AND `updatedAt` > ?;',
GET_DATA_ID = 'SELECT `dataId` FROM `map` WHERE `key`=? AND `val`=?;',
GET_DATA_ID_V = 'SELECT `dataId`, `val` FROM `map` WHERE `key`=? AND `val` IN (?)',
GET_DATA_ID_KV = 'SELECT `dataId`, `key`, `val` FROM `map` WHERE ',
SET = 'INSERT INTO `map` (`dataId`, `key`, `val`, `createdBy`) VALUES ? ON DUPLICATE KEY UPDATE `val`=VALUES(`val`), `updatedBy`=VALUES(`createdBy`);'

var
common = require('pico-common'),
secret = ['un', 'passwd', 'token', 'platform', 'pushToken'],
client, KEYS, IDS

module.exports = {
    setup: function(context, next){
        client = context.sqlTracker
        var k = require('./key')
        KEYS = k.keys()
        IDS = k.ids()
        secret = secret.map(function(k){return IDS[k]})
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
        client.query(GET, [dataId, secret], function(err, result){
            if (err) return cb(err)
            return cb(null, common.map(result, KEYS, 'key', 'val'))
        })
    },
    getVal: function(dataId, key, cb){
        client.query(GET_VAL, [dataId, IDS[key]], cb)
    },
    getVals: function(dataId, keys, cb){
        if (!keys || !keys.length) return cb(null, {})
        client.query(GET_VALS, [dataId, keys.map(function(k){return IDS[k]})], function(err, result){
            if (err) return cb(err)
            cb(null, common.group(result, KEYS, 'key'))
        })
    },
    getMultiVal: function(dataIds, key, cb){
        client.query(GET_MULTI_VAL, [dataIds, IDS[key]], function(err, result){
            var group = common.group(result, [], 'dataId')
            for (var k in group){
                group[k] = common.map(group[k], KEYS, 'key', 'val')
            }
            cb(null, group)
        })
    },
    getMultiVals: function(dataIds, keys, cb){
        if (!keys || !keys.length) return cb(null, {})
        client.query(GET_MULTI_VALS, [dataIds, keys.map(function(k){return IDS[k]})], function(err, result){
            if (err) return cb(err)
            var group = common.group(result, [], 'dataId')
            for (var k in group){
                group[k] = common.map(group[k], KEYS, 'key', 'val')
            }
            cb(null, group)
        })
    },
    getNew: function(dataId, at, cb){
        client.query(GET_NEW, [dataId, secret, at], function(err, result){
            if (err) return cb(err)
            return cb(null, common.map(result, KEYS, 'key', 'val'))
        })
    },
    getDataId: function(key, value, cb){
        client.query(GET_DATA_ID, [IDS[key], value], cb)
    },
    getDataIdV: function(key, values, cb){
        if (!values || !values.length) return cb(null, [])
        client.query(GET_DATA_ID_V, [IDS[key], values], cb)
    },
    getDataIdKV: function(kv, cb){
        if (!(kv instanceof Object)) return cb(null, [])
        var keys = Object.keys(kv)
        if (!keys.length) return cb(null, [])

        var
        tpl = [],
        params = []
        for(var i=0,k; k=keys[i]; i++){
            tpl.push('(`key`=? AND `val`=?)')
            params.push(IDS[k])
            params.push(kv[k])
        }
        client.query(GET_DATA_ID_KV+tpl.join(' OR ')+';', params, cb)
    }
}
