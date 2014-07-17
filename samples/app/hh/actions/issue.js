const
MODEL = 'issue',
ME = 'me',
LIST = 'list'

var
common = require('./common'),
sql = require('../models/sql/issue')

module.exports = {
    setup: function(context, next){
        var web = context.webServer

        web.route('hh/issue/create', [this.create])
        web.route('hh/issue/list', [this.list])
        web.route('hh/issue/read', [this.read])
        web.route('hh/issue/update', [this.update])
        web.route('hh/issue/remove', [this.remove])

        next()
    },
    byTransfer: function(session, order, next){
        sql.byList(common.pluck(session.getModel('transfer')['transfer'], 'issueId'), function(err, result){
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
    byDoctor: function(session, order, next){
        if (!order.doctorId) return next(G_CERROR['400'])

        sql.byDoctor(order.doctorId, function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[LIST] = result

            next()
        })
    },
    filterByResult: function(session, order, next){
        var
        result = session.getModel('result')['result'],
        model = session.getModel(MODEL),
        output = []

        if (result.length){
            var
            issues = session.getModel(MODEL)[LIST],
            issueIds = [],
            issue,iId, i, l

            for(i=0,l=result.length; i<l; i++){
                iId = result[i].issueId
                issueIds.push(iId)
            }
            for(i=0,l=issues.length; i<l; i++){
                issue = issues[i]
                if (-1 === issueIds.indexOf(issue.id)) continue
                output.push(issue)
            }
        }
        model[MODEL] = output 

        session.addJob(
            G_PICO_WEB.RENDER_FULL,
            [[session.createModelInfo(MODEL, MODEL)]]
        )

        next()
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
