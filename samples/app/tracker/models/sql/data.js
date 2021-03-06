const
GET = 'SELECT * FROM `data` WHERE `id`=?;',
GET_TYPE = 'SELECT * FROM `data` WHERE `type`=?;',
GET_LIST = 'SELECT * FROM `data` WHERE `id` IN (?);',
GET_SEEN = 'SELECT * FROM `data` WHERE `seenAt` > ?;',
GET_NEW = 'SELECT * FROM `data` WHERE `updatedAt` > ?;',
GET_TYPE_RANGE = 'SELECT * FROM `data` WHERE `type`=? AND `updatedAt` > ? AND `updatedAt` < ?;',
GET_VALID = 'SELECT id FROM `data` WHERE `id` IN (?) AND `status`=1;',
CREATE = 'INSERT INTO `data` (`type`, `createdBy`) VALUES (?);',
TOUCH = 'UPDATE `data` SET `updatedBy`=?, `updatedAt`=NOW() WHERE `id`=? AND `status`=1;',
SEEN = 'UPDATE `data` SET `seen`=`seen`+1, `seenAt`=NOW() WHERE `id`=? AND `status`=1;',
REMOVE = 'UPDATE `data` SET `status`=0, `updatedBy`=?, `updatedAt`=NOW() WHERE `id`=?;'

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
    create: function(type, by, cb){
        client.query(CREATE, [[IDS[type], by]], function(err, result){
            if (err) return cb(err)
            return cb(null, common.replace(result, KEYS, 'type'))
        })
    },
    touch: function(id, by, cb){
        client.query(TOUCH, [by, id], cb)
    },
    seen: function(id, cb){
        client.query(SEEN, [id], cb)
    },
    remove: function(id, by, cb){
        client.query(REMOVE, [by, id], cb)
    },
    get: function(id, cb){
        client.query(GET, [id], function(err, result){
            if (err) return cb(err)
            return cb(null, common.replace(result, KEYS, 'type'))
        })
    },
    getType: function(type, cb){
        client.query(GET_TYPE, [IDS[type]], function(err, result){
            if (err) return cb(err)
            return cb(null, common.replace(result, KEYS, 'type'))
        })
    },
    getList: function(ids, cb){
        client.query(GET_LIST, [ids], function(err, result){
            if (err) return cb(err)
            return cb(null, common.replace(result, KEYS, 'type'))
        })
    },
    getSeen: function(at, cb){
        client.query(GET_SEEN, [at], function(err, result){
            if (err) return cb(err)
            return cb(null, common.replace(result, KEYS, 'type'))
        })
    },
    getNew: function(at, cb){
        client.query(GET_NEW, [at], function(err, result){
            if (err) return cb(err)
            return cb(null, common.replace(result, KEYS, 'type'))
        })
    },
    getTypeRange: function(type, from, to, cb){
        client.query(GET_TYPE_RANGE, [IDS[type], from, to], function(err, result){
            if (err) return cb(err)
            return cb(null, common.replace(result, KEYS, 'type'))
        })
    },
    getValid: function(ids, cb){
        client.query(GET_VALID, [ids], cb)
    }
}
