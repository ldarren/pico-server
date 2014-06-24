const
KEY_CHANNEL = 'hC:',
KEY_CHANNEL_COUNTER = 'sCC:',
KEY_MESSAGE_COUNTER = 'counter',
KEY_MESSAGE_PASS = 'pass'

var
Random = Math.random,
Ceil = Math.ceil,
ChannelStorage = module.exports = {
    client: null,
    expiry: 1 * 60 * 60,  // expire after 1 hour
}

function getChannelKey(channelId){
    return KEY_CHANNEL + channelId
}
function getChannelCounterKey(min){
    return KEY_CHANNEL_COUNTER + min
}
function getMessageCounterKey(channelId){
    return KEY_MESSAGE_COUNTER + channelId
}
function newMessagePass(client, cb){
    return Ceil(Random()*1000)
}
ChannelStorage.prototype = {
    setup: function(redisClient, expiry){
        this.client = redisClient
        this.expiry = expiry
    },
    newChannelId: function(cb){
        var
        client = this.client,
        expiry = this.expiry,
        now = new Date(),
        key = getChannelCounterKey(now.getMinutes())

        client.multi()
        .incr(key)
        .expire(key, 120)
        .exec(function(err, ret){
            if (err) return cb(err)
            var
            channelId = now.getTime()*1000 + ret[0],
            channelPass = newMessagePass()

            key = getChannelKey(channelId)

            client.multi()
            .hset(key, KEY_MESSAGE_PASS, channelPass)
            .expire(key, expiry)
            .exec(function(err){
                return cb(err, channelId, channelPass)
            })
        })
    },
    renewChannelId: function(channelId, oldChannelPass, cb){
        var
        client = this.client,
        expiry = this.expiry,
        key = getChannelKey(channelId)

        client.hget(key, KEY_MESSAGE_PASS, function(err, pass){
            if (err) return cb(err)
            if (oldChannelPass != pass) return cb('wrong channel pass')

            var channelPass = newMessagePass()

            client.multi()
            .hset(key, KEY_MESSAGE_PASS, channelPass)
            .expire(key, expiry)
            .exec(function(err){
                return cb(err, channelId, channelPass)
            })
        })
    },
    newMessageId: function(channelId, cb){
        var key = getChannelKey(channelId)
        this.client.hincrby(key, KEY_MESSAGE_COUNTER, 1, cb)
    },

    storeMessage: function(channelId, msgId, msg, cb){
        var key = getChannelKey(channelId)
        this.client.multi()
        .hset(key, msgId, msg)
        .expire(key, this.expiry)
        .exec(function(err){
            return cb(err)
        })
    },
    retrieveMsgIds: function(channelId, cb){
        this.client.hkeys(getChannelKey(channelId), function(err, msgIds){
            if (err) return cb(err)
            var i = msgIds.indexOf(KEY_MESSAGE_COUNTER)
            msgIds.splice(i, 1)
            i = msgIds.indexOf(KEY_MESSAGE_PASS)
            msgIds.splice(i, 1)
            cb(null, msgIds)
        })
    },
    retrieveMessage: function(channelId, msgId, cb){
        this.client.hget(getChannelKey(channelId), msgId, cb)
    },
    retrieveMessages: function(channelId, msgIds, cb){
        var args = msgIds.slice()
        args.unshift(getChannelKey(channelId))
        this.client.hmget(args, cb)
    },
    retrieveAllMessages: function(channelId, cb){
        this.client.hgetall(getChannelKey(channelId), cb)
    },
    removeMessages: function(channelId, msgIds, cb){
        var args = msgIds.slice()
        args.unshift(getChannelKey(channelId))
        this.client.hdel(args, cb)
    },
    removeMessage: function(channelId, msgId, cb){
        this.client.hdel(getChannelKey(channelId), msgId, cb)
    }
}
