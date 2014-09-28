const
GET = 'SELECT * FROM `ref` WHERE `dataId`=?;',
GET_VAL = 'SELECT * FROM `ref` WHERE `dataId`=? AND `refId`=?;',
GET_NEW = 'SELECT * FROM `ref` WHERE `dataId`=? AND `updatedAt` > ?;',
SET = 'INSERT INTO `ref` (`dataId`, `refId`, `val`, `createdBy`) VALUES ? ON DUPLICATE KEY UPDATE `val`=VALUES(`val`),`updatedBy`=VALUES(`createdBy`),`status`=1;',
TOUCH = 'UPDATE `ref` SET `updatedBy`=?, `updatedAt`=NOW() WHERE `refId`=? AND `status`=1;',
REMOVE = 'UPDATE `ref` SET `status`=0, `updatedBy`=?, `updatedAt`=NOW() WHERE `dataId` IN (?) AND `refId`=?;',
REMOVE_REF = 'UPDATE `ref` SET `status`=0, `updatedBy`=?, `updatedAt`=NOW() WHERE `dataId`=? AND `refId` IN (?);',
REMOVE_REF_ALL = 'UPDATE `ref` SET `status`=0, `updatedBy`=?, `updatedAt`=NOW() WHERE `refId`=?;'

var client

module.exports = {
    setup: function(context, next){
        client = context.sqlTracker
        next()
    },
    setRef: function(dataId, refs, vals, by, cb){
        if (!refs.length) return cb(null, [])
        var params = []
        for(var i=0,r; r=refs[i]; i++){
            params.push([dataId, r, vals[i], by])
        }
        client.query(SET, [params], cb)
    },
    set: function(data, refId, vals, by, cb){
        if (!data.length) return cb(null, [])
        var params = []
        for(var i=0,d; d=data[i]; i++){
            params.push([d, refId, vals[i], by])
        }
        client.query(SET, [params], cb)
    },
    touch: function(refId, by, cb){
        client.query(TOUCH, [by, refId], cb)
    },
    remove: function(dataIds, refId, by, cb){
        client.query(REMOVE, [by, dataIds, refId], cb)
    },
    removeRef: function(dataId, refIds, by, cb){
        client.query(REMOVE_REF, [by, dataId, refIds], cb)
    },
    removeRefAll: function(refId, by, cb){
        client.query(REMOVE_REF_ALL, [by, refId], cb)
    },
    get: function(dataId, cb){
        client.query(GET, [dataId], cb)
    },
    getVal: function(dataId, refId, cb){
        client.query(GET_VAL, [dataId, refId], cb)
    },
    getNew: function(dataId, at, cb){
        client.query(GET_NEW, [dataId, at], cb)
    }
}
