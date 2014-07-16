const
MODEL = 'history',
ME = 'me',
LIST = 'list'

var sql = require('../models/sql/history')

module.exports = {
    setup: function(context, next){
        var web = context.webServer

        web.route('hh/history/create', [this.create])
        web.route('hh/history/list', [this.list])
        web.route('hh/history/read', [this.read])
        web.route('hh/history/update', [this.update])
        web.route('hh/history/remove', [this.remove])

        next()
    },
    byDoctor: function(session, order, next){
        if (!order.doctorId) return next(G_CERROR['400'])

        sql.byDoctor(order.doctorId, function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[MODEL] = result

            next()
        })
    },
    create: function(session, order, next){
        if (!order.name || !order.json) return next(G_CERROR['400'])

        sql.create(order, function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[ME] = {id: result.insertId}
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, ME)]]
            )

            next()
        })
    },
    list: function(session, order, next){
        sql.list(function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[LIST] = result

            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, LIST)]]
            )

            next()
        })
    },
    read: function(session, order, next){
        if (!order.id) return next(G_CERROR['400'])

        sql.read(order.id, function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[ME] = result[0]

            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, ME)]]
            )

            next()
        })
    },
    update: function(session, order, next){
        if (!order.id) return next(G_CERROR['400'])

        sql.update(order, function(err, result){
            if (err) return next(err)

            session.addJob(
                G_PICO_WEB.RENDER_HEADER
            )

            next()
        })
    },
    remove: function(session, order, next){
        if (!order.id) return next(G_CERROR['400'])
        sql.remove(order.id, function(err, result){
            if (err) return next(err)

            session.addJob(
                G_PICO_WEB.RENDER_HEADER
            )

            next()
        })
    }
}
