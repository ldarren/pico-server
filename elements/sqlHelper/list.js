const
GET = 'SELECT * FROM `list` WHERE `dataId`=?;',
GET_VAL = 'SELECT * FROM `list` WHERE `dataId`=? AND`k`=?;',
GET_NEW = 'SELECT * FROM `list` WHERE `dataId`=? AND `updatedAt` > ?;',
CREATE = 'INSERT INTO `list` (`dataId`, `k`, `json`, `createdBy`) VALUES (?);',
UPDATE = 'UPDATE `list` `json`=?, `updatedBy`=? WHERE `id`=? AND `status`=1;',
REMOVE = 'UPDATE `list` SET `status`=0, `updatedBy`=? WHERE `id`=?;'

var
sc = require('pico-common').obj,
List = function(){}

module.exports = List

List.prototype = {
    setup: function(client, hash, cb){
        this.client = client
        this.hash = hash 
        cb()
    },
    create: function(dataId, key, values, by, cb){
        if (!values.length) return cb(null, [])
        var params = [], k=this.hash.toVal(key)
        for(var i=0,v; v=values[i]; i++){
            params.push([dataId, k, v, by])
        }
        this.client.query(CREATE, [params], cb)
    },
    update: function(id, val, by, cb){
        this.client.query(SEEN, [val, by, id], cb)
    },
    remove: function(id, by, cb){
        this.client.query(REMOVE, [by, id], cb)
    },
    get: function(dataId, cb){
        var h = this.hash
        this.client.query(GET, [dataId], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.group(result, h.keys(), 'k'), result)
        })
    },
    getVal: function(dataId, key, cb){
        var h = this.hash
        this.client.query(GET_VAL, [dataId, h.toVal(key)], cb)
    },
    getNew: function(dataId, at, cb){
        var h = this.hash
        this.client.query(GET_NEW, [dataId, at], function(err, result){
            if (err) return cb(err)
            return cb(null, sc.group(result, h.keys(), 'k'), result)
        })
    }
}
