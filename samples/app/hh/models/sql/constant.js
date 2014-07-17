const
WARD = 'SELECT id, name, specialty, subSpecialty FROM ward;',
DOCTOR = 'SELECT id, name, ic FROM doctor;'

var client

module.exports = {
    setup: function(context, next){
        client = context.sqlHH
        next()
    },

    ward: function(cb){
        client.query(WARD, cb)
    },

    doctor: function(cb){
        client.query(DOCTOR, cb)
    },
}
