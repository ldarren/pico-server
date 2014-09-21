const MODEL = 'listener'

var
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
common = require('../../../lib/common'),
add = function(userId, list, cb){
    if (!list || !list.length) return cb()
    sqlMap.getDataIdV('user', list, function(err, result){
        if (err) return cb(err)
        var refIds = common.pluck(result, 'dataId')
        sqlRef.set(userId, refIds.concat(userId), userId, cb)
    })
},
remove = function(userId, list, cb){
    if (!list || !list.length) return cb()
    sqlMap.getDataIdV('user', list, function(err, result){
        if (err) return cb(err)
        var refIds = common.pluck(result, 'dataId')
        sqlRef.remove(userId, refIds, userId, cb)
    })
}

module.exports = {
    setup: function(context, next){
        next()
    },
    update: function(session, order, next){
        var
        model = session.getModel(MODEL),
        userId = model.userId,
        addList = model.add,
        removeList = model.remove
        if (!userId || (!addList && removeList)) return next()
        add(userId, addList, function(err){
            if (err) return next(err)
            remove(userId, removeList, function(err){
                if (err) return next(err)
                next()
            })
        })
    }
}
