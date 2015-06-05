const
GET = 'SELECT `k`, `json` FROM `map` WHERE `dataId`=? AND `k` NOT IN (?);',
GET_VAL = 'SELECT * FROM `map` WHERE `dataId`=? AND `k`=?;',
GET_VALS = 'SELECT * FROM `map` WHERE `dataId`=? AND `k` IN (?);',
GET_MULTI_VAL = 'SELECT * FROM `map` WHERE `dataId` IN (?) AND `k`=?;',
GET_MULTI_VALS = 'SELECT * FROM `map` WHERE `dataId` IN (?) AND `k` IN (?);',
GET_NEW = 'SELECT `k`, `json` FROM `map` WHERE `dataId`=? AND `k` NOT IN (?) AND `updatedAt` > ?;',
GET_DATA_ID = 'SELECT `dataId` FROM `map` WHERE `k`=? AND `json`=?;',
GET_DATA_ID_V = 'SELECT `dataId`, `json` FROM `map` WHERE `k`=? AND `json` IN (?)',
GET_DATA_ID_KV = 'SELECT `dataId`, `k`, `json` FROM `map` WHERE ',
SET = 'INSERT INTO `map` (`dataId`, `k`, `json`, `createdBy`) VALUES ? ON DUPLICATE KEY UPDATE `json`=VALUES(`json`), `updatedBy`=VALUES(`createdBy`);',
REMOVE = 'UPDATE `map` SET `status`=0, `updatedBy`=? WHERE `id`=?;'

var
sc = require('pico-common').obj,
Map = function(){}

module.exports = Map

Map.prototype = {
    setup: function(client, hash, hidden, cb){
        this.client = client
        this.hash = hash
        this.secret = (hidden || []).map(function(k){return hash.toVal(k)})
        cb()
    },
    set: function(dataId, kv, by, cb){
        var keys = Object.keys(kv)
        if (!keys.length) return cb(null, [])
        var
        h = this.hash,
        params = []
        for(var i=0,k; k=keys[i]; i++){
            params.push([dataId, h.toVal(k), kv[k], by])
        }
        this.client.query(SET, [params], cb)
    },
    get: function(dataId, cb){
        var h = this.hash
        this.client.query(GET, [dataId, secret], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.map(result, h.keys(), 'k', 'json'))
        })
    },
    getVal: function(dataId, key, cb){
        this.client.query(GET_VAL, [dataId, this.hash.toVal(key)], cb)
    },
    getVals: function(dataId, keys, cb){
        if (!keys || !keys.length) return cb(null, {})
        var h = this.hash
        this.client.query(GET_VALS, [dataId, keys.map(function(k){return h.toVal(k)})], function(err, result){
            if (err) return cb(err)
            cb(null, sc.group(result, h.keys(), 'k'))
        })
    },
    getMultiVal: function(dataIds, key, cb){
        var h = this.hash
        this.client.query(GET_MULTI_VAL, [dataIds, h.toVal(key)], function(err, result){
            var group = sc.group(result, [], 'dataId')
            for (var k in group){
                group[k] = sc.map(group[k], h.keys(), 'k', 'json')
            }
            cb(null, group)
        })
    },
    getMultiVals: function(dataIds, keys, cb){
        if (!keys || !keys.length) return cb(null, {})
        var h = this.hash
        this.client.query(GET_MULTI_VALS, [dataIds, keys.map(function(k){return h.toVal(k)})], function(err, result){
            if (err) return cb(err)
            var group = sc.group(result, [], 'dataId')
            for (var k in group){
                group[k] = sc.map(group[k], h.keys(), 'k', 'json')
            }
            cb(null, group)
        })
    },
    getNew: function(dataId, at, cb){
        var h = this.hash
        this.client.query(GET_NEW, [dataId, secret, at], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.map(result, h.keys(), 'k', 'json'))
        })
    },
    getDataId: function(key, value, cb){
        this.client.query(GET_DATA_ID, [this.hash.toVal(key), value], cb)
    },
    getDataIdV: function(key, values, cb){
        if (!values || !values.length) return cb(null, [])
        this.client.query(GET_DATA_ID_V, [this.hash.toVal(key), values], cb)
    },
    getDataIdKV: function(kv, cb){
        if (!(kv instanceof Object)) return cb(null, [])
        var keys = Object.keys(kv)
        if (!keys.length) return cb(null, [])

        var
        h = this.hash,
        tpl = [],
        params = []
        for(var i=0,k; k=keys[i]; i++){
            tpl.push('(`k`=? AND `json`=?)')
            params.push(h.toVal(k))
            params.push(kv[k])
        }
        this.client.query(GET_DATA_ID_KV+tpl.join(' OR ')+';', params, cb)
    }
}
