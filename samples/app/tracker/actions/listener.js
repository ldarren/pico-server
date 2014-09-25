var
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
common = require('../../../lib/common'),
addView = function(dataId, view, cb){
    if (!view || !view.length) return cb(null, G_USER_TYPE_LIST)
    sqlMap.getDataIdV('user', view, function(err, result){
        if (err) return cb(err)
        sqlRef.setRef(dataId, common.pluck(result, 'dataId').concat([dataId]), [], dataId, function(err){
            cb(err, G_USER_TYPE_LIST.filter(function(e){return -1===view.indexOf(e)}))
        })
    })
},
addSeen = function(dataId, seen, cb){
    if (!seen || !seen.length) return cb(null, G_USER_TYPE_LIST)
    sqlMap.getDataIdV('user', seen, function(err, result){
        if (err) return cb(err)
        sqlRef.set(common.pluck(result, 'dataId'), dataId, [], dataId, function(err){
            cb(err, G_USER_TYPE_LIST.filter(function(e){return -1===seen.indexOf(e)}))
        })
    })
},
removeView = function(dataId, view, cb){
    if (!view || !view.length) return cb()
    sqlMap.getDataIdV('user', view, function(err, result){
        if (err) return cb(err)
        sqlRef.removeRef(dataId, common.pluck(result, 'dataId'), dataId, cb)
    })
},
removeSeen = function(dataId, seen, cb){
    if (!seen || !seen.length) return cb()
    sqlMap.getDataIdV('user', seen, function(err, result){
        if (err) return cb(err)
        sqlRef.remove(common.pluck(result, 'dataId'), dataId, dataId, cb)
    })
}

module.exports = {
    setup: function(context, next){
        next()
    },
    update: function(session, order, next){
        var
        model = session.getModel(G_MODEL.LISTENER),
        dataId = model.dataId
        if (!dataId) return next()
        addView(dataId, model.view, function(err, notView){
            if (err) return next(err)
            removeView(dataId, notView, function(err){
                if (err) return next(err)
                addSeen(dataId, model.seen, function(err, notSeen){
                    if (err) return next(err)
                    removeSeen(dataId, notSeen, function(err){
                        if (err) return next(err)
                        next()
                    })
                })
            })
        })
    }
}
