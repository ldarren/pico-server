const
MODEL = 'constant',
SPEC = 'spec'

var
common = require('./common'),
mem = require('../models/sql/constant'),
spec

module.exports = {
    setup: function(context, next){
        mem.spec(function(err, result){
            if (err) return console.error(err)
            spec = result
        })

        var web = context.webServer

        web.route('pico/constant/list', [this.list])

        next()
    },
    list: function(session, order, next){
        session.getModel(MODEL)[SPEC] = spec

        session.addJob([session.subJob(MODEL, SPEC)])

        next()
    }
}
