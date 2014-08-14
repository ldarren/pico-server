var client

module.exports = {
    setup: function(context, next){
        client = context.memStore
        next()
    },

    create: function(key, ttl, cb){
        client.touch(key, ttl || 0, cb)
    },

    read: function(key, cb){
        client.get(key, cb)
    },

    reads: function(keys, cb){
        client.getMulti(keys, cb)
    },

    readTread: function(key, cb){
        client.gets(key, cb)
    },

    update: function(key, value, ttl, cb){
        client.set(key, value, ttl || 0, cb)
    },

    updateTread: function(key, value, cas, ttl, cb){
        client.set(key, value, cas, ttl || 0, cb)
    },

    remove: function(key, cb){
        client.del(key, cb)
    },

    removeAll: function(cb){
        client.flush(cb)
    }
}
