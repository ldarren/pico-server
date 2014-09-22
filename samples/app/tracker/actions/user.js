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
        var
        un = order.un,
        passwd = order.passwd
        if (!un || !passwd) return next(G_CERROR[401])
        sqlMap.getDataId('un', un, function(err, result){
            if (err) return next(err)
            if (result.length) return next(G_CERROR[401])
            sqlData.create('user', 0, function(err, result){
                if(err) return next(err)
                var
                userId = result.insertId,
                token = createToken(order),
                detail = JSON.stringify({
                    name:order.name,
                    mobile:order.mobile,
                    email:order.email,
                })
                sqlMap.set(userId, {un:un, passwd:passwd, token:token, user:TYPE_LEAD, detail:detail}, userId, function(err){
                    if(err) return next(err)
                    session.getModel(MODEL)[MODEL] = {
                        id:userId,
                        token: token 
                    }
                    session.addJob([session.subJob(MODEL, MODEL)])
                    session.getModel('listener')['listener'] = {add:[TYPE_SUPER, TYPE_ADMIN], dataId:userId}
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
    }
}
