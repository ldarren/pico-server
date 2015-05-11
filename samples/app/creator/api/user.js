'use strict'
var
crypto = require('crypto'),
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
createToken = function(order){ return crypto.createHash('sha1').update(JSON.stringify(order)+Date.now()).digest('base64') }

module.exports = {
    setup: function(context, next){
        next()
    },
    signin: function(session, order, next){
        sqlMap.getDataId('un', order.un, function(err, result){
            if (err) return next(err)
            if (!result.length) return next(G_CERROR[401])
            var userId = result[0].dataId
            sqlMap.getVal(userId, 'passwd', function(err, result){
                if (err) return next(err)
                if (!result.length || result[0].val !== order.passwd) return next(G_CERROR[401])
                sqlData.get(userId, function(err, result){
                    if (err) return next(err)
                    var data = result[0]
                    if (!data) return next(G_CERROR[401])
                    if ('user' !== data.type) return next(G_CERROR[401])
                    var token = createToken(order)
                    sqlMap.set(userId, {token:token}, userId, function(err){
                        if (err) return next(err)
                        session.getModel(G_MODEL.USER)[G_MODEL.USER] = {
                            id: userId,
                            token: token 
                        }
                        session.addJob([session.subJob(G_MODEL.USER, G_MODEL.USER)])
                        next()
                    })
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
                sqlMap.set(userId, {un:un, passwd:passwd, token:token, user:G_USER_TYPE.USER, json:JSON.stringify(json)}, userId, function(err){
                    if(err) return next(err)
                    session.getModel(G_MODEL.USER)[G_MODEL.USER] = {
                        id:userId,
                        token: token 
                    }
                    session.addJob([session.subJob(G_MODEL.USER, G_MODEL.USER)])

                    var l = session.getModel(G_MODEL.LISTENER)
                    l.view=[G_USER_TYPE.ADMIN]
                    l.seen=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN]
                    l.dataId=userId

                    var n = session.getModel(G_MODEL.NOTIFIER)
                    n.dataId = userId
                    n.title = 'New User'
                    n.msg = json.name + 'is asking to join us'

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
            case 'user':
            case 'platform':
            case 'pushToken': data[k]=order[k]; break
            default: json[k] = order[k]; break
            }
        }
        if (!userId || (!Object.keys(data).length)) return next(G_CERROR[400])
        if (Object.keys(json).length) data.json = JSON.stringify(json)
        sqlMap.getVal(updatedBy, 'user', function(err, result){
            if (err) return next(err)
            if (result[0].val < G_USER_TYPE.ADMIN){ // not admin
                delete data.user
                if (updatedBy != userId) return next(G_CERROR[401]) // not self and not admin
            }
            sqlMap.set(userId, data, updatedBy, function(err){
                if (err) return next(err)

                session.getModel(G_MODEL.USER)[G_MODEL.USER] = data
                session.addJob([session.subJob(G_MODEL.USER, G_MODEL.USER)])
                if (!data.user && !data.json) return next()

                sqlRef.touch(userId, updatedBy, function(err){
                    if (err) return next(err)
                    var l = session.getModel(G_MODEL.LISTENER)
                    switch(parseInt(data.user)){
                    case G_USER_TYPE.USER:
                        l.view=[G_USER_TYPE.ADMIN],
                        l.seen=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN],
                        l.vehicle=false
                        l.dataId = userId
                        break
                    case G_USER_TYPE.ADMIN:
                        l.view=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN, G_USER_TYPE.USER],
                        l.seen=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN, G_USER_TYPE.USER],
                        l.vehicle=true
                        l.job=true
                        l.dataId = userId
                        break
                    case G_USER_TYPE.SUPER:
                        l.view=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN, G_USER_TYPE.USER],
                        l.seen=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN],
                        l.vehicle=true
                        l.job=true
                        l.dataId = userId
                        break
                    }

                    var n = session.getModel(G_MODEL.NOTIFIER)
                    n.dataId = userId
                    n.title = 'Account updated'
                    n.msg = 'Your account has been updated'

                    next()
                })
            })
        })
    }
}
