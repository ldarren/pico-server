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
        web.route('hh/doctor/list', [this.doctorAll])
        web.route('hh/ward/list', [this.wardAll])

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
    },
    doctorAll: function(session, order, next){
        var model = session.getModel(MODEL)
        model[DOCTOR] = doctor 

        session.addJob(
            G_PICO_WEB.RENDER_FULL,
            [[session.createModelInfo(MODEL, DOCTOR)]]
        )

        next()
    },
    wardAll: function(session, order, next){
        var model = session.getModel(MODEL)
        model[WARD] = ward

        session.addJob(
            G_PICO_WEB.RENDER_FULL,
            [[session.createModelInfo(MODEL, WARD)]]
        )

        next()
    }
}
