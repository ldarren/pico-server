const MODEL = 'user'
var sql = require('../models/sql/user')

module.exports = {
    setup: function(context, next){
    },
    create: function(session, order, next){
        sql.read(order.un, order.pwd, function(err, result){
            if (err) return next(err)
            var model = session.getModel(MODEL)[MODEL] = result
            session.addJob([session.subJob(MODEL, MODEL)])
            next()
        })
    }
}
