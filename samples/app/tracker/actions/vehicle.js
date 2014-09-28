const MODEL = 'vehicle'

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
                var
                dataId = result.insertId,
                json={}
                for(var k in order){
                    switch(k){
                    case 'type':
                    case 'token':
                    case 'id': break
                    default: json[k] = order[k]
                    }
                }
                json = JSON.stringify(json)
                sqlMap.set(dataId, {json:json}, createdBy, function(err){
                    if(err) return next(err)
                    session.getModel(G_MODEL.VEHICLE)[G_MODEL.VEHICLE] = {
                        id:dataId,
                        json:json
                    }
                    session.addJob([session.subJob(G_MODEL.VEHICLE, G_MODEL.VEHICLE)])
                    var l = session.getModel(G_MODEL.LISTENER)
                    l.seen=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN, G_USER_TYPE.DRIVER]
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
            var
            dataId = order.dataId,
            json={}
            for(var k in order){
                switch(k){
                case 'type':
                case 'token':
                case 'id': break
                default: json[k] = order[k]
                }
            }
            json = JSON.stringify(json)
            sqlMap.set(dataId, {json:json}, updatedBy, function(err){
                if(err) return next(err)
                session.getModel(G_MODEL.VEHICLE)[G_MODEL.VEHICLE] = {
                    id:dataId,
                    json:json
                }
                session.addJob([session.subJob(G_MODEL.VEHICLE, G_MODEL.VEHICLE)])
                next()
            })
        })
    },
    remove: function(session, order, next){
        var updatedBy = order.id
        sqlMap.getVal(updatedBy, 'user', function(err, result){
            if (err) return next(err)
            if (result[0].val < G_USER_TYPE.ADMIN) return next(G_CERROR[401])
            var dataId = order.dataId
            sqlData.remove(dataId, updatedBy, function(err){
                if(err) return next(err)
                sqlRef.removeRefAll(dataId, next())
            })
        })
    }
}
