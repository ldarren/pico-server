const MODEL = 'transfer'

var sql = require('../models/sql/transfer')

module.exports = {
    setup: function(context, next){
        var web = context.webServer

        web.route('hh/transfer/create', [this.create])
        web.route('hh/transfer/update', [this.update])
        web.route('hh/transfer/remove', [this.remove])

        next()
    },
    byDoctor: function(session, order, next){
        if (!order.doctorId) return next(G_CERROR['400'])

        sql.byDoctor(order.doctorId, function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[MODEL] = result

            session.addJob([session.subJob(MODEL, MODEL)])

            next()
        })
    },
    create: function(session, order, next){
        if (!order.name || !order.json) return next(G_CERROR['400'])

        sql.create(order, function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[MODEL] = {id: result.insertId}
            session.addJob( [session.subJob(MODEL, MODEL)])

            next()
        })
    },
    update: function(session, order, next){
        if (!order.id) return next(G_CERROR['400'])

        sql.update(order, function(err, result){
            if (err) return next(err)

            next()
        })
    },
    remove: function(session, order, next){
        if (!order.id) return next(G_CERROR['400'])
        sql.remove(order.id, function(err, result){
            if (err) return next(err)

            next()
        })
    }
}
