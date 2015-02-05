var
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
common = require('pico-common'),
addView = function(dataId, view, cb){
    if (!view || !view.length) return cb(null, G_USER_TYPE_LIST)
    sqlMap.getDataIdV('user', view, function(err, result){
        if (err) return cb(err)
        sqlRef.setRef(dataId, common.pluck(result, 'dataId').concat([dataId]), [], dataId, function(err){
            cb(err, G_USER_TYPE_LIST.filter(function(e){return -1===view.indexOf(e)}))
        })
    })
},
addSeen = function(dataId, seen, seenBy, cb){
    if ((!seen || !seen.length) && !seenBy.length) return cb(null, G_USER_TYPE_LIST)
    if(!seen || !seen.length){
        sqlRef.set(seenBy, dataId, [], dataId, function(err){
            cb(err, G_USER_TYPE_LIST.filter(function(e){return -1===seen.indexOf(e)}))
        })
        return
    }
    sqlMap.getDataIdV('user', seen, function(err, result){
        if (err) return cb(err)
        sqlRef.set(common.pluck(result, 'dataId').concat(seenBy), dataId, [], dataId, function(err){
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
removeSeen = function(dataId, seen, seenBy, cb){
    if (!seen || !seen.length) return cb()
    sqlMap.getDataIdV('user', seen, function(err, result){
        if (err) return cb(err)
        sqlRef.remove(common.pluck(result, 'dataId').filter(function(s){return -1===seenBy.indexOf(s)}), dataId, dataId, cb)
    })
},
addRemove = function(type, dataId, seen, cb){
    if (undefined === seen) return cb()
    sqlData.getType(type, function(err, result){
        if (err) return cb(err)
        if (seen){
            sqlRef.setRef(dataId, common.pluck(result, 'id'), [], dataId, cb)
        }else{
            sqlRef.removeRef(dataId, common.pluck(result, 'id'), dataId, cb)
        }
    })
}

module.exports = {
    setup: function(context, next){
        next()
    },
    update: function(session, order, next){
        var
        model = session.getModel(G_MODEL.LISTENER),
        dataId = model.dataId,
        seenBy = model.seenBy || []
        if (!dataId) return next()
        addView(dataId, model.view, function(err, notView){
            if (err) return next(err)
            removeView(dataId, notView, function(err){
                if (err) return next(err)
                addSeen(dataId, model.seen, seenBy || [], function(err, notSeen){
                    if (err) return next(err)
                    removeSeen(dataId, notSeen, seenBy, function(err){
                        if (err) return next(err)
                        addRemove('vehicle', dataId, model.vehicle, function(err){
                            if (err) return next(err)
                            addRemove('job', dataId, model.job, function(err){
                                if (err) return next(err)
                                next()
                            })
                        })
                    })
                })
            })
        })
    }
}
