const
MODEL = 'job',
Random = Math.random,
Ceil = Math.ceil

var
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref')

module.exports = {
    setup: function(context, next){
        next()
    },
    create: function(session, order, next){
        var createdBy = order.id
        sqlMap.getVal(createdBy, 'user', function(err, result){
            if (err) return next(err)
            if (result[0].val < G_USER_TYPE.ADMIN) return next(G_CERROR[401])
            sqlData.create(order.type, createdBy, function(err, result){
                if(err) return next(err)
                var dataId = result.insertId

                sqlMap.set(dataId, {month:order.month, date:order.json}, createdBy, function(err){
                    if(err) return next(err)
                    session.getModel(G_MODEL.EXPENSE)[G_MODEL.EXPENSE] = {
                        id:dataId,
                        type:order.type,
                        status: 1,
                        month:order.month,
                        date:order.json
                    }
                    session.addJob([session.subJob(G_MODEL.EXPENSE, G_MODEL.EXPENSE)])
                    var l = session.getModel(G_MODEL.LISTENER)
                    l.seen=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN]
                    l.dataId=dataId
                    next()
                })
            })
        })
    },
    update: function(session, order, next){
        var updatedBy = order.id
        sqlMap.getVal(updatedBy, 'user', function(err, result){
            if (err) return next(err)
            if (result[0].val < G_USER_TYPE.ADMIN) return next(G_CERROR[401])
            var dataId = order.dataId
            sqlMap.set(dataId, {date:order.json}, updatedBy, function(err){
                if(err) return next(err)
                session.getModel(G_MODEL.EXPENSE)[G_MODEL.EXPENSE] = {
                    id:dataId,
                    date:order.json
                }
                session.addJob([session.subJob(G_MODEL.EXPENSE, G_MODEL.EXPENSE)])
                next()
            })
        })
    }
}
