const MODEL = 'result'

var
common = require('./common'),
sql = require('../models/sql/result')

module.exports = {
    setup: function(context, next){
        var web = context.webServer

        web.route('hh/result/create', [this.create])
        web.route('hh/result/list', [this.list])
        web.route('hh/result/read', [this.read])
        web.route('hh/result/update', [this.update])
        web.route('hh/result/remove', [this.remove])

        next()
    },
    byIssue: function(session, order, next){
        sql.byList(common.pluck(session.getModel('issue')['issue'], 'id'), function(err, result){
            if (err) return next(err)
            var model = session.getModel(MODEL)
            model[MODEL] = result
            session.addJob( [session.subJob(MODEL, MODEL)])
            next()
        })
    },
    byHistory: function(session, order, next){
        sql.byList(common.pluck(session.getModel('history')['history'], 'resultId'), function(err, result){
            if (err) return next(err)
            var model = session.getModel(MODEL)
            model[MODEL] = result
            session.addJob( [session.subJob(MODEL, MODEL)])
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
        if (!order.id) return next(G_CERROR['400'])

        sql.read(order.id, function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[MODEL] = result[0]

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
