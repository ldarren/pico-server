const
SPEC = 'SELECT id, name, json FROM spec;'

var client

module.exports = {
    setup: function(context, next){
        client = context.sqlStudioProject
        next()
    },

    spec: function(cb){
        client.query(SPEC, cb)
    },
}
