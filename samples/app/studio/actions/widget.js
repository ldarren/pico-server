const MODEL = 'widget'

var
common = require('./common'),
sql = require('../models/sql/widget')

module.exports = {
    setup: function(context, next){
        var web = context.webServer

        web.route('pico/widget/create', [this.create])
        web.route('pico/widget/list', [this.list])
        web.route('pico/widget/read', [this.read])
        web.route('pico/widget/update', [common.stringify, this.update])
        web.route('pico/widget/remove', [this.remove])

        next()
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
    list: function(session, order, next){
        sql.list(function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[MODEL] = result

            session.addJob( [session.subJob(MODEL, MODEL)])

            model = session.getModel('common')
            model[MODEL] = MODEL

            next()
        })
    },
    read: function(session, order, next){
        if (!order.id) return next(G_CERROR['400'])

        sql.read(order.id, function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[MODEL] = result[0]

            session.addJob( [session.subJob(MODEL, MODEL)])

            model = session.getModel('common')
            model[MODEL] = MODEL

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
