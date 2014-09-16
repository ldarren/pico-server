const
READ = 'SELECT ? FROM `key`';

var client

module.exports = {
    setup: function(context, next){
        next()
    },
    read: function(data, cb){
        client.query(READ, data, cb)
    }
}
