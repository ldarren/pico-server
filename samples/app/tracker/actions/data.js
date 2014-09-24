var
Max = Math.max,
actUser = require('./user'),
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
common = require('../../../lib/common'),
getMax = function(seen, list){
    var dates = [seen]
    for(var key in list){
        dates.push(Max.apply(null, common.pluck(list[key], 'updatedAt')))
    }
    return Max.apply(null, dates)
},
loadNew = function(data, seen, latest, cb){
    var dataId = data.id
    sqlMap.getNew(dataId, seen, function(err, map){
        if (err) return cb(err)
        data = common.merge(data, map)
        sqlList.getNew(dataId, seen, function(err, list){
            if (err) return cb(err)
            data = common.merge(data, list)
            sqlRef.getNew(dataId, seen, function(err, refs){
                if (err) return cb(err)
                data.refs = refs
                cb(null, data, getMax(Max(data.updatedAt, latest), list))
            })
        })
    })
},
loadAllNew = function(summary, seen, details, latest, cb){
    if (!summary.length) return cb(null, details, latest)
    loadNew(summary.pop(), seen, latest, function(err, data, date){
        if (err) return cb(err)
        details.push(data)
        if (date > latest) latest = date
        loadAllNew(summary, seen, details, latest, cb)
    })
},
load = function(data, cb){
    var dataId = data.id
    sqlMap.get(dataId, function(err, map){
        if (err) return cb(err)
        data = common.merge(data, map)
        sqlList.get(dataId, function(err, list){
            if (err) return cb(err)
            data = common.merge(data, list)
            sqlRef.get(dataId, function(err, refs){
                if (err) return cb(err)
                data.refs = refs
                cb(null, data)
            })
        })
    })
},
loadAll = function(summary, details, cb){
    if (!summary.length) return cb(null, details)
    load(summary.pop(), function(err, data){
        if (err) return cb(err)
        details.push(data)
        loadAll(summary, details, cb)
    })
}

module.exports = {
    setup: function(context, next){
        next()
    },
    poll: function(session, order, next){
        var
        refId = order.id,
        seen = order.seen
        if (!refId) return next(G_CERROR[400])
        sqlRef.getNew(refId, seen, function(err, result){
            if (err) return next(err)
            if (!result.length){
                session.getModel(G_MODEL.DATA)[G_MODEL.DATA] = { seen: seen }
                session.addJob([session.subJob(G_MODEL.DATA, G_MODEL.DATA)])
                return next()
            }
            sqlData.getList(common.pluck(result, 'refId'), function(err, summary){
                if (err) return next(err)
                loadAllNew(summary, seen, [], new Date(seen), function(err, details, latest){
                    if (err) return next(err)
                    session.getModel(G_MODEL.DATA)[G_MODEL.DATA] = {
                        seen: (new Date(latest)).toISOString(),
                        data: details
                    }
                    session.addJob([session.subJob(G_MODEL.DATA, G_MODEL.DATA)])
                    next()
                })
            })
        })
    },
    list: function(session, order, next){
        var dataIds = order.dataIds
        if (!dataIds) return next(G_CERROR[400])
        var
        model = session.getModel(G_MODEL.DATA)
        data = model[G_MODEL.DATA] = []
        session.addJob([session.subJob(G_MODEL.DATA, G_MODEL.DATA)])
        if (!dataIds.length) return next()
        sqlData.getList(dataIds, function(err, summary){
            if (err) return next(err)
            loadAll(summary, data, function(err){
                if (err) return next(err)
                next()
            })
        })
    },
    getType: function(session, order, next){
        var id = order.dataId
        if (!id) return next(G_CERROR[400])
        sqlData.get(id, function(err, result){
            if (err) return next(err)
            if (!result.length) return next(G_CERROR[400])
            session.getModel(G_MODEL.DATA)[G_MODEL.DATA] = result[0]
            next()
        })
    },
    update: function(session, order, next){
        var data = session.getModel(G_MODEL.DATA)[G_MODEL.DATA]
        switch(data.type){
        case 'user': actUser.update(session, order, next); break
        case 'vehicle':
        case 'job':
        default: return next(G_CERROR[400])
        }
    }
}
