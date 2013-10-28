const
KEY_CHANNEL = 'hC:',
KEY_CHANNEL_COUNTER = ':sCC:',
KEY_MESSAGE_COUNTER = 'counter';

var ChannelStorage = module.exports = {
    client: null,
    expiry: 1 * 60 * 60,  // expire after 1 hour
};

function getChannelKey(channelId){
    return KEY_CHANNEL + channelId;
}
function getMessageCounterKey(channelId){
    return KEY_MESSAGE_COUNTER + channelId;
}

ChannelStorage.prototype = {
    setup: function(redisClient, expiry){
        this.client = redisClient;
        this.expiry = expiry;
    },
    newChannelId: function(cb){
        this.client.incr(KEY_CHANNEL_COUNTER, cb);
    },

    storeMessage: function(channelId, msg, cb){
        var cId = this.getChannelKey(channelId);
        this.client.hincrby(cid, KEY_MESSAGE_COUNTER, function(err, msgId){
            if(err) return cb(err);
            this.client.multi()
            .hset(cId, msgId, msg)
            .expire(cId, this.expiry)
            .exec(function(err){
                return cb(err, msgId);
            });
        });
    },
    retrieveMsgIds: function(channelId, cb){
        this.client.hkeys(channelId, cb);
    },
    retrieveMessage: function(channelId, msgId, cb){
        this.client.hget(this.getChannelKey(channelId), msgId, cb);
    },
    retrieveMessages: function(channelId, msgIds, cb){
        var args = msgIds.slice();
        args.unshift(this.getChannelKey(channelId));
        this.client.hvals(args, cb);
    },
    retrieveAllMessages: function(channelId, cb){
        this.client.hgetall(this.getChannelKey(channelId), cb);
    },
    removeMessages: function(channelId, msgIds, cb){
        var args = msgIds.slice();
        args.unshift(this.getChannelKey(channelId));
        this.client.hdel(args, cb);
    },
    removeMessage: function(channelId, msgId, cb){
        this.client.hdel(this.getChannelKey(channelId), msgId, cb);
    }
};
