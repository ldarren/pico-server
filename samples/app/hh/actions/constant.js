const
MODEL = 'constant',
WARD = 'ward',
DOCTOR = 'doctor'

var
sql = require('../models/sql/constant'),
ward, doctor

module.exports = {
    setup: function(context, next){
        sql.ward(function(err, result){
            if (err) return console.error(err)
            ward = result
        })
        sql.doctor(function(err, result){
            if (err) return console.error(err)
            doctor = result
        })

        var web = context.webServer

        web.route('hh/constant/list', [this.list])

        next()
    },
    list: function(session, order, next){
        var model = session.getModel(MODEL)
        model[WARD] = ward
        model[DOCTOR] = doctor 

        session.addJob(
            G_PICO_WEB.RENDER_FULL,
            [[session.createModelInfo(MODEL, WARD)],[session.createModelInfo(MODEL, DOCTOR)]]
        )

        next()
    }
}
