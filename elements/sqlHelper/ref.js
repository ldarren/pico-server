const
GET = 'SELECT * FROM `ref` WHERE `dataId`=?;',
GET_TYPE = 'SELECT * FROM `ref` WHERE `dataId`=? & `type`=?;',
REF_TYPE = 'SELECT * FROM `ref` WHERE `refId`=? & `type`=?;',
GET_VAL = 'SELECT * FROM `ref` WHERE `dataId`=? & `type`=? & `refId`=?;',
GET_NEW = 'SELECT * FROM `ref` WHERE ??=? & `updatedAt` > ?;',
// mysql optimization might not set updatedAt if no changes
SET = 'INSERT INTO `ref` (`dataId`, `type`,`refId`, `json`, `createdBy`) VALUES ? ON DUPLICATE KEY UPDATE `json`=VALUES(`json`),`updatedBy`=VALUES(`createdBy`),`status`=1,`updatedAt`=NOW();',
TOUCH = 'UPDATE `ref` SET `updatedBy`=? WHERE `refId`=? & `type`=? & `status`=1;',
REMOVE = 'UPDATE `ref` SET `status`=0, `updatedBy`=? WHERE `dataId` IN (?) & `type`=? & `refId`=?;',
REMOVE_REF = 'UPDATE `ref` SET `status`=0, `updatedBy`=? WHERE `dataId`=? & `type`=? & `refId` IN (?);',
REMOVE_REF_ALL = 'UPDATE `ref` SET `status`=0, `updatedBy`=? WHERE `refId`=? & `type`=?;'

var Ref = function(){}

module.exports = Ref

Ref.prototype = {
    setup: function(client, hash, cb){
        this.client = client
        this.hash = hash
        cb()
    },
    setRef: function(dataId, type, refs, vals, by, cb){
        if (!refs.length) return cb(null, [])
        var
        t=this.hash.toVal(type),
        params = []
        for(var i=0,r; r=refs[i]; i++){
            params.push([dataId, t, r, vals[i], by])
        }
        this.client.query(SET, [params], cb)
    },
    set: function(data, type, refId, vals, by, cb){
        if (!data.length) return cb(null, [])
        var
        t=this.hash.toVal(type),
        params = []
        for(var i=0,d; d=data[i]; i++){
            params.push([d, t, refId, vals[i], by])
        }
        this.client.query(SET, [params], cb)
    },
    touch: function(type, refId, by, cb){
        this.client.query(TOUCH, [by, refId, this.hash.toVal(type)], cb)
    },
    remove: function(dataIds, type, refId, by, cb){
        if (!dataIds.length) return cb(null, dataIds)
        this.client.query(REMOVE, [by, dataIds, to.hash.toVal(type), refId], cb)
    },
    removeRef: function(dataId, type, refIds, by, cb){
        if (!refIds.length) return cb(null, refIds)
        this.client.query(REMOVE_REF, [by, dataId, this.hash.toVal(type), refIds], cb)
    },
    removeRefAll: function(type, refId, by, cb){
        this.client.query(REMOVE_REF_ALL, [by, refId, this.hash.toVal(type)], cb)
    },
    get: function(dataId, cb){
        this.client.query(GET, [dataId], cb)
    },
    getType: function(dataId, type, cb){
        this.client.query(GET_TYPE, [dataId,this.hash.toVal(type)], cb)
    },
    getRefTo: function(type, refId, cb){
        this.client.query(REF, [refId, this.hash.toVal(type)], cb)
    },
    getVal: function(dataId, type, refId, cb){
        this.client.query(GET_VAL, [dataId, this.hash.toVal(type), refId], cb)
    },
    getNew: function(dataId, at, cb){
        this.client.query(GET_NEW, ['dataId', dataId, at], cb)
    },
    getNewRef: function(refId, at, cb){
        this.client.query(GET_NEW, ['refId', refId, at], cb)
    }
}
