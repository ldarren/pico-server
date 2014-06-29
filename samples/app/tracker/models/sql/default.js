const
GET_CONSTS = 'SELECT id, name, cat FROM const;',
GET_FIELD_TYPES = 'SELECT id, name FROM fieldType;',
GET_FIELDS = 'SELECT `module`, `order`, `locale`, `display`, `name`, `type`, `options`, `placeholder`, `pattern` FROM field;'

var client

module.exports = {
    setup: function(context, next){
        client = context.sqlTrackerDefault
        next()
    },

    readConsts: function(cb){
        client.query(GET_CONSTS, cb)
    },

    readFieldTypes: function(cb){
        client.query(GET_FIELD_TYPES, cb)
    },

    readFields: function(cb){
        client.query(GET_FIELDS, cb)
    }
}
