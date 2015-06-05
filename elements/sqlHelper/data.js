const
GET = 'SELECT * FROM `data` WHERE `id`=?;',
GET_TYPE = 'SELECT * FROM `data` WHERE `type`=?;',
GET_LIST = 'SELECT * FROM `data` WHERE `id` IN (?);',
GET_NEW = 'SELECT * FROM `data` WHERE `updatedAt` > ?;',
GET_TYPE_RANGE = 'SELECT * FROM `data` WHERE `type`=? AND `updatedAt` > ? AND `updatedAt` < ?;',
GET_VALID = 'SELECT id FROM `data` WHERE `id` IN (?) AND `status`=1;',
CREATE = 'INSERT INTO `data` (`type`, `createdBy`) VALUES (?);',
TOUCH = 'UPDATE `data` SET `updatedBy`=?, `updatedAt`=NOW() WHERE `id`=? AND `status`=1;',
REMOVE = 'UPDATE `data` SET `status`=0, `updatedBy`=? WHERE `id`=?;'

var
sc = require('pico-common').obj,
Data = function(){}

module.exports = Data

Data.prototype = {
    setup: function(client, hash, cb){
        this.client = client 
        this.hash = hash
        cb()
    },
    create: function(type, by, cb){
        var h = this.hash
        this.client.query(CREATE, [[h.toVal(type), by]], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, h.keys(), 'type'))
        })
    },
    touch: function(id, by, cb){
        this.client.query(TOUCH, [by, id], cb)
    },
    remove: function(id, by, cb){
        this.client.query(REMOVE, [by, id], cb)
    },
    get: function(id, cb){
        var h=this.hash
        this.client.query(GET, [id], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, h.keys(), 'type'))
        })
    },
    getType: function(type, cb){
        var h=this.hash
        this.client.query(GET_TYPE, [h.toVal(type)], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, h.keys(), 'type'))
        })
    },
    getList: function(vals, cb){
        var h=this.hash
        this.client.query(GET_LIST, [vals], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, h.keys(), 'type'))
        })
    },
    getNew: function(at, cb){
        var h=this.hash
        this.client.query(GET_NEW, [at], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, h.keys(), 'type'))
        })
    },
    getTypeRange: function(type, from, to, cb){
        var h=this.hash
        this.client.query(GET_TYPE_RANGE, [h.toVal(type), from, to], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.replace(result, h.keys(), 'type'))
        })
    },
    getValid: function(vals, cb){
        this.client.query(GET_VALID, [vals], cb)
    }
}
