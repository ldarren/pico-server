const
MODEL = 'user',
TYPE_LEAD = 11,
TYPE_CUSTOMER = 21,
TYPE_DRIVER = 31,
TYPE_ADMIN = 41,
TYPE_SUPER = 101

var
crypto = require('crypto'),
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
createToken = function(order){
    return crypto.createHash('sha1').update(JSON.stringify(order)+Date.now()).digest('base64')
}

module.exports = {
    setup: function(context, next){
        next()
    },
    signin: function(session, order, next){
        sqlMap.getDataIdKV(order, function(err, result){
            if (err) return next(err)
            if (result.length < 2) return next(G_CERROR[401])
            var userId = result[0].dataId
            if (userId !== result[1].dataId) return next(G_CERROR[401])
            sqlData.get(userId, function(err, result){
                if (err) return next(err)
                var data = result[0]
                if (!data) return next(G_CERROR[401])
                if ('user' !== data.type) return next(G_CERROR[401])
                var token = createToken(order)
                sqlMap.set(userId, {token:token}, userId, function(err){
                    if (err) return next(err)
                    session.getModel(MODEL)[MODEL] = {
                        id: userId,
                        token: token 
                    }
                    session.addJob([session.subJob(MODEL, MODEL)])
                    next()
                })
            })
        })
    },
    signup: function(session, order, next){
        var un, passwd, json={}
        for(var k in order){
            switch(k){
            case 'token':
            case 'id': break
            case 'un': un = order[k]
            case 'passwd': passwd = order[k]
            default: json[k] = order[k]
            }
        }
        if (!un || !passwd) return next(G_CERROR[401])
        sqlMap.getDataId('un', un, function(err, result){
            if (err) return next(err)
            if (result.length) return next(G_CERROR[401])
            sqlData.create('user', 0, function(err, result){
                if(err) return next(err)
                var
                userId = result.insertId,
                token = createToken(order)
                sqlMap.set(userId, {un:un, passwd:passwd, token:token, user:TYPE_LEAD, json:JSON.stringify(json)}, userId, function(err){
                    if(err) return next(err)
                    session.getModel(MODEL)[MODEL] = {
                        id:userId,
                        token: token 
                    }
                    session.addJob([session.subJob(MODEL, MODEL)])
                    var l = session.getModel('listener')
                    l.add=[TYPE_SUPER, TYPE_ADMIN]
                    l.dataId=userId
                    next()
                })
            })
        })
    },
    verify: function(session, order, next){
        sqlMap.getDataId('token', order.token, function(err, result){
            if (err) return next(err)
            if (1 === result.length && order.id === result[0].dataId) return next()
            next(G_CERROR[403])
        })
    },
    update: function(session, order, next){
        var
        updatedBy = order.id,
        data={}, userId, json={}
        for(var k in order){
            switch(k){
            case 'token':
            case 'id':
            case 'un':
            case 'passwd': break
            case 'dataId': userId = parseInt(order[k]); break
            case 'user': data[k]=order[k]; break
            default: json[k] = order[k]; break
            }
        }
        var hasJSON = Object.keys(json).length
        if (!userId || (!Object.keys(data).length && !hasJSON)) return next(G_CERROR[400])
        if (hasJSON) data.json = JSON.stringify(json)
        sqlMap.getVal(updatedBy, 'user', function(err, result){
            if (err) return next(err)
            if (result[0].val < TYPE_ADMIN){ // not admin
                delete data.user
                if (updatedBy != userId) return next(G_CERROR[403]) // not self and not admin
            }
            sqlMap.set(userId, data, updatedBy, function(err){
                if (err) return next(err)
                sqlRef.touch(userId, updatedBy, function(err){
                    if (err) return next(err)
                    var l = session.getModel('listener')
                    l.dataId = userId
                    switch(parseInt(data.user)){
                        case TYPE_LEAD: l.add=[TYPE_SUPER, TYPE_ADMIN], l.remove=[TYPE_DRIVER, TYPE_CUSTOMER, TYPE_LEAD]; break
                        case TYPE_CUSTOMER: l.add=[TYPE_SUPER, TYPE_ADMIN], l.remove=[TYPE_DRIVER, TYPE_CUSTOMER, TYPE_LEAD]; break
                        case TYPE_DRIVER: l.add=[TYPE_SUPER, TYPE_ADMIN, TYPE_DRIVER], l.remove=[TYPE_CUSTOMER, TYPE_LEAD]; break
                        case TYPE_ADMIN: l.add=[TYPE_SUPER, TYPE_ADMIN], l.remove=[TYPE_DRIVER, TYPE_CUSTOMER, TYPE_LEAD]; break
                        case TYPE_SUPER: l.add=[TYPE_SUPER], l.remove=[TYPE_ADMIN, TYPE_CUSTOMER, TYPE_LEAD]; break
                    }
                    session.getModel(MODEL)[MODEL] = data
                    session.addJob([session.subJob(MODEL, MODEL)])
                    next()
                })
            })
        })
    }
}
