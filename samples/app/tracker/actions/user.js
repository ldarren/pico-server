const MODEL = 'user'
var
crypto = require('crypto'),
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref')

module.exports = {
    setup: function(context, next){
    },
    signin: function(session, order, next){
        sqlMap.getDataIds(order.cred, function(err, result){
            if (err) return next(err)
            var userId = result[0]
            if (userId !== result[1]) return next(G_CERROR[401])
            sqlData.get(userId, function(err, result){
                if (err) return next(err)
                var data = result[0]
                if (!data) return next(G_CERROR[401])
                if ('user' !== data.type) return next(G_CERROR[401])
                var token = crypto.createHash('sha1').update(JSON.stringify(order)+Date.now()).disgest('base64')
                sqlMap.set(userId, {token:token}, userId, function(err){
                    if (err) return next(err)
                    var model = session.getModel(MODEL)[MODEL] = {
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
    }
}
