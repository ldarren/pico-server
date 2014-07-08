const
MODEL = 'driver',
LIST = 'list'

var sql = require('../models/sql/driver')

module.exports = {
    read: function(session, order, next){
        sql.read(function(err, result){
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
}
