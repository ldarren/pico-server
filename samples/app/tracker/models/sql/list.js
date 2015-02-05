const
GET = 'SELECT * FROM `list` WHERE `dataId`=?;',
GET_VAL = 'SELECT * FROM `list` WHERE `dataId`=? AND `key`=?;',
GET_SEEN = 'SELECT * FROM `list` WHERE `seenAt` > ?;',
GET_NEW = 'SELECT * FROM `list` WHERE `dataId`=? AND `updatedAt` > ?;',
CREATE = 'INSERT INTO `list` (`dataId`, `key`, `val`, `createdBy`) VALUES (?);',
UPDATE = 'UPDATE `list` `val`=?, `updatedBy`=?, `updatedAt`=NOW() WHERE `id`=? AND `status`=1;',
SEEN = 'UPDATE `list` SET `seen`=`seen`+1, `seenAt`=NOW() WHERE `id`=? AND `status`=1;',
REMOVE = 'UPDATE `list` SET `status`=0, `updatedBy`=?, `updatedAt`=NOW() WHERE `id`=?;'

var
common = require('pico-common'),
client, KEYS, IDS

module.exports = {
    setup: function(context, next){
        client = context.sqlTracker
        var k = require('./key')
        KEYS = k.keys()
        IDS = k.ids()
        next()
    },
    create: function(dataId, key, values, by, cb){
        if (!values.length) return cb(null, [])
        var params = [], k=IDS[key]
        for(var i=0,v; v=values[i]; i++){
            params.push([dataId, k, v, by])
        }
        client.query(CREATE, [params], cb)
    },
    update: function(id, val, by, cb){
        client.query(SEEN, [val, by, id], cb)
    },
    seen: function(id, cb){
        client.query(SEEN, [id], cb)
    },
    remove: function(id, by, cb){
        client.query(REMOVE, [by, id], cb)
    },
    get: function(dataId, cb){
        client.query(GET, [dataId], function(err, result){
            if (err) return cb(err)
            return cb(null, common.group(result, KEYS, 'key'), result)
        })
    },
    getVal: function(dataId, key, cb){
        client.query(GET_VAL, [dataId, KEYS[key]], cb)
    },
    getSeen: function(at, cb){
        client.query(GET_SEEN, [at], function(err, result){
            if (err) return cb(err)
            return cb(null, common.group(result, KEYS, 'key'), result)
        })
    },
    getNew: function(dataId, at, cb){
        client.query(GET_NEW, [dataId, at], function(err, result){
            if (err) return cb(err)
            return cb(null, common.group(result, KEYS, 'key'), result)
        })
    }
}
