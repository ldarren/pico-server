const
MODEL = 'constant',
SPEC = 'spec'

var
common = require('./common'),
sql = require('../models/sql/constant'),
spec

module.exports = {
    setup: function(context, next){
        sql.spec(function(err, result){
            if (err) return console.error(err)
            spec = common.parseAll(result)
        })

        var web = context.webServer

        web.route('pico/constant/list', [this.list, common.parse])

        next()
    },
    list: function(session, order, next){
        var model = session.getModel(MODEL)
        model[SPEC] = spec

        session.addJob([session.subJob(MODEL, SPEC)])

        next()
    }
}
