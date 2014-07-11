const
FIELD = 'SELECT id, name, json FROM field;'

var client

module.exports = {
    setup: function(context, next){
        client = context.sqlStudioProject
        next()
    },

    field: function(cb){
        client.query(FIELD, cb)
    },
}
