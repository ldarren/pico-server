const
CREATE = 'INSERT INTO `data` (?) VALUES ?;'

var client

module.exports = {
    setup: function(context, next){
    },
    create: function(data, cb){
        client.query(CREATE, data, cb)
    }
}
