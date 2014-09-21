const MODEL = 'data'

var
Max = Math.max,
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
common = require('../../../lib/common'),
getMax = function(seen, list){
    var latest = [seen]
    for(var key in list){
        lastest.push(Max.apply(null, concat(common.pluck(list[key], 'updatedAt'))))
    }
    return Max.apply(null, latest)
},
load = function(data, seen, cb){
    var dataId = data.id
    sqlMap.getNew(dataId, seen, function(err, map){
        if (err) return cb(err)
        data = common.merge(data, map)
        sqlList.getNew(dataId, seen, function(err, list){
            if (err) return cb(err)
            data = common.merge(data, map)
            cb(null, data, getMax(seen, list))
        })
    })
},
loadAll = function(summary, seen, details, latest, cb){
    if (!summary.length) return cb(null, details, latest)
    load(summary.pop(), seen, function(err, data, date){
        if (err) return cb(err)
        details.push(data)
        if (date > latest) latest = date
        loadAll(dataIds, seen, details, latest, cb)
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
                session.getModel(MODEL)[MODEL] = { seen: seen }
                session.addJob([session.subJob(MODEL, MODEL)])
                return next()
            }
            sqlData.getList(common.pluck(result, 'dataId'), function(err, summary){
                if (err) return next(err)
                loadAll(summary, seen, [], seen, function(err, details, latest){
                    if (err) return next(err)
                    session.getModel(MODEL)[MODEL] = {
                        seen: latest,
                        data: details
                    }
                    session.addJob([session.subJob(MODEL, MODEL)])
                    next()
                })
            })
        })
    }
}
