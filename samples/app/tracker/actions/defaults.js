const
MODEL = 'default',
FIELDS = 'fields',
FIELD_TYPES = 'fieldTypes',
CONSTS = 'consts'

var
sql = require('../models/sql/default'),
fields, fieldTypes, consts

module.exports = {
    setup: function(context, next){
        sql.readFieldTypes(function(err, result){
            if (err) return console.error(err)
            fieldTypes = result
        })
        sql.readFields(function(err, result){
            if (err) return console.error(err)
            fields = result
        })
        sql.readConsts(function(err, result){
            if (err) return console.error(err)
            consts = result
        })

        var web = context.webServer
        web.route('tracker/defaults/read', [this.read])
        next()
    },
    read: function(session, order, next){
        var model = session.getModel(MODEL)
        model[FIELD_TYPES] = fieldTypes
        model[FIELDS] = fields
        model[CONSTS] = consts

        session.addJob(
            G_PICO_WEB.RENDER_FULL,
            [[session.createModelInfo(MODEL, FIELD_TYPES)], [session.createModelInfo(MODEL, FIELDS)], [session.createModelInfo(MODEL, CONSTS)]]
        )

        next()
    }
}
