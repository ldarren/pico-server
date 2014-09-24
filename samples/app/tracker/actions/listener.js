const MODEL = 'listener'

var
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
common = require('../../../lib/common'),
add = function(dataId, list, cb){
    if (!list || !list.length) return cb()
    sqlMap.getDataIdV('user', list, function(err, result){
        if (err) return cb(err)
        var refIds=[]
        if (result.length) refIds = common.pluck(result, 'dataId')
        sqlRef.set(dataId, refIds.concat([dataId]), [], dataId, cb)
    })
},
remove = function(dataId, list, cb){
    if (!list || !list.length) return cb()
    sqlMap.getDataIdV('user', list, function(err, result){
        if (err) return cb(err)
        var refIds = common.pluck(result, 'dataId')
        sqlRef.remove(dataId, refIds, dataId, cb)
    })
}

module.exports = {
    setup: function(context, next){
        next()
    },
    update: function(session, order, next){
        var model = session.getModel(MODEL)
        dataId = model.dataId,
        addList = model.add,
        removeList = model.remove
        if (!dataId || (!addList && !removeList)) return next()
        add(dataId, addList, function(err){
            if (err) return next(err)
            remove(dataId, removeList, function(err){
                if (err) return next(err)
                next()
            })
        })
    }
}
