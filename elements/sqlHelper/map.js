const
GET = 'SELECT `k`, `v` FROM `map` WHERE `dataId`=? AND `k` NOT IN (?);',
GET_VAL = 'SELECT * FROM `map` WHERE `dataId`=? AND `k`=?;',
GET_VALS = 'SELECT * FROM `map` WHERE `dataId`=? AND `k` IN (?);',
GET_MULTI_VAL = 'SELECT * FROM `map` WHERE `dataId` IN (?) AND `k`=?;',
GET_MULTI_VALS = 'SELECT * FROM `map` WHERE `dataId` IN (?) AND `k` IN (?);',
GET_NEW = 'SELECT `k`, `v` FROM `map` WHERE `dataId`=? AND `k` NOT IN (?) AND `updatedAt` > ?;',
GET_DATA_ID = 'SELECT `dataId` FROM `map` WHERE `k`=? AND `v`=?;',
GET_DATA_ID_V = 'SELECT `dataId`, `v` FROM `map` WHERE `k`=? AND `v` IN (?)',
GET_DATA_ID_KV = 'SELECT `dataId`, `k`, `v` FROM `map` WHERE ',
SET = 'INSERT INTO `map` (`dataId`, `k`, `v`, `createdBy`) VALUES ? ON DUPLICATE KEY UPDATE `v`=VALUES(`v`), `updatedBy`=VALUES(`createdBy`);'

var
sc = require('pico-common'),
Map = function(){},
client, KEYS, IDS, secret

module.exports = Map

Map.prototype = {
    setup: function(connClient, hidden, cb){
        this.client = client = connClient 
        var c = require('./const')
        this.KEYS = KEYS = c.keys()
        this.IDS = IDS = c.vals()
        this.secret = secret = (hidden || []).map(function(k){return IDS[k]})
        cb()
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
            return cb(null, sc.map(result, KEYS, 'k', 'v'))
        })
    },
    getVal: function(dataId, key, cb){
        client.query(GET_VAL, [dataId, IDS[key]], cb)
    },
    getVals: function(dataId, keys, cb){
        if (!keys || !keys.length) return cb(null, {})
        client.query(GET_VALS, [dataId, keys.map(function(k){return IDS[k]})], function(err, result){
            if (err) return cb(err)
            cb(null, sc.group(result, KEYS, 'k'))
        })
    },
    getMultiVal: function(dataIds, key, cb){
        client.query(GET_MULTI_VAL, [dataIds, IDS[key]], function(err, result){
            var group = sc.group(result, [], 'dataId')
            for (var k in group){
                group[k] = sc.map(group[k], KEYS, 'k', 'v')
            }
            cb(null, group)
        })
    },
    getMultiVals: function(dataIds, keys, cb){
        if (!keys || !keys.length) return cb(null, {})
        client.query(GET_MULTI_VALS, [dataIds, keys.map(function(k){return IDS[k]})], function(err, result){
            if (err) return cb(err)
            var group = sc.group(result, [], 'dataId')
            for (var k in group){
                group[k] = sc.map(group[k], KEYS, 'k', 'v')
            }
            cb(null, group)
        })
    },
    getNew: function(dataId, at, cb){
        client.query(GET_NEW, [dataId, secret, at], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.map(result, KEYS, 'k', 'v'))
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
            tpl.push('(`k`=? AND `v`=?)')
            params.push(IDS[k])
            params.push(kv[k])
        }
        client.query(GET_DATA_ID_KV+tpl.join(' OR ')+';', params, cb)
    }
}
