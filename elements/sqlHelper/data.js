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
sc = require('pico-common'),
Data = function(){},
client, KEYS, IDS

module.exports = Data

Data.prototype = {
    setup: function(connClient, cb){
        this.client = client = connClient 
        var c = require('./const')
        this.KEYS = KEYS = c.keys()
        this.IDS = IDS = c.vals()
        cb()
    },
    create: function(type, by, cb){
        client.query(CREATE, [[IDS[type], by]], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, KEYS, 'type'))
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
            return cb(null, sc.replace(result, KEYS, 'type'))
        })
    },
    getType: function(type, cb){
        client.query(GET_TYPE, [IDS[type]], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, KEYS, 'type'))
        })
    },
    getList: function(vals, cb){
        client.query(GET_LIST, [vals], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, KEYS, 'type'))
        })
    },
    getSeen: function(at, cb){
        client.query(GET_SEEN, [at], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, KEYS, 'type'))
        })
    },
    getNew: function(at, cb){
        client.query(GET_NEW, [at], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, KEYS, 'type'))
        })
    },
    getTypeRange: function(type, from, to, cb){
        client.query(GET_TYPE_RANGE, [IDS[type], from, to], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, KEYS, 'type'))
        })
    },
    getValid: function(vals, cb){
        client.query(GET_VALID, [vals], cb)
    }
}
