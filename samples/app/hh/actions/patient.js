const
MODEL = 'patient',
ME = 'me',
LIST = 'list'

var
common = require('./common'),
sql = require('../models/sql/patient')

module.exports = {
    setup: function(context, next){
        var web = context.webServer

        web.route('hh/patient/create', [this.create])
        web.route('hh/patient/list', [this.list])
        web.route('hh/patient/read', [this.read])
        web.route('hh/patient/update', [this.update])
        web.route('hh/patient/remove', [this.remove])

        next()
    },
    byIssue: function(session, order, next){
        sql.byList(common.pluck(session.getModel('issue')['issue'], 'patientId'), function(err, result){
            if (err) return next(err)
            var model = session.getModel(MODEL)
            model[MODEL] = result
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, MODEL)]]
            )
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
        var
        id = order.id,
        name = order.name

        if (!id && !name) return next(G_CERROR['400'])

        var go = function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[ME] = result[0]

            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, ME)]]
            )

            next()
        }

        if (id) sql.read(id, go)
        else sql.readByName(name, go)
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
