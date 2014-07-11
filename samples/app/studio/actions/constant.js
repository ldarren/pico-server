const
MODEL = 'constant',
FIELD = 'field'

var
common = require('./common'),
sql = require('../models/sql/constant'),
field

module.exports = {
    setup: function(context, next){
        sql.field(function(err, result){
            if (err) return console.error(err)
            field = common.parseAll(result)
        })

        var web = context.webServer

        web.route('pico/constant/list', [this.list, common.parse])

        next()
    },
    list: function(session, order, next){
        var model = session.getModel(MODEL)
        model[FIELD] = field

        session.addJob(
            G_PICO_WEB.RENDER_FULL,
            [[session.createModelInfo(MODEL, FIELD)]]
        )

        next()
    }
}
