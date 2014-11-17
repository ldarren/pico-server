const MODEL = 'project'

var
common = require('./common')
sql = require('../models/sql/project')

module.exports = {
    setup: function(context, next){
        var web = context.webServer

        web.route('pico/project/create', [this.create])
        web.route('pico/project/list', [this.list])
        web.route('pico/project/read', [this.read])
        web.route('pico/project/update', [this.update])
        web.route('pico/project/remove', [this.remove])

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

            next()
        })
    },
    read: function(session, order, next){
        var
        id = order.id,
        name = order.name

        if (!id && !name) return next(G_CERROR['400'])

        var go = function(err, result){
            if (err) return next(err)
            if (!result.length) return next(G_CERROR['400'])

            var model = session.getModel(MODEL)
            model[MODEL] = result[0]

            session.addJob( [session.subJob(MODEL, MODEL)])

            model = session.getModel('common')
            model[MODEL] = MODEL

            next()
        }

        if (id) sql.read(id, go)
        else sql.readByName(name, go)
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
