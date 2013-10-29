const
KEY_CHANNEL = 'hC:',
KEY_CHANNEL_COUNTER = 'sCC:',
KEY_MESSAGE_COUNTER = 'counter';

var ChannelStorage = module.exports = {
    client: null,
    expiry: 1 * 60 * 60,  // expire after 1 hour
};

function getChannelKey(channelId){
    return KEY_CHANNEL + channelId;
}
function getChannelCounterKey(min){
    return KEY_CHANNEL_COUNTER + min;
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
        var
        now = new Date(),
        key = getChannelCounterKey(now.getMinutes());
        this.client.multi()
        .incr(key)
        .expire(key, 120)
        .exec(function(err, ret){
            cb(err, ret ? now.getTime()*1000 + ret[0] : undefined);
        });
    },
    newMessageId: function(channelId, cb){
        var cId = this.getChannelKey(channelId);
        this.client.hincrby(cid, KEY_MESSAGE_COUNTER, cb);
    },

    storeMessage: function(channelId, msgId, msg, cb){
        var cId = this.getChannelKey(channelId);
        this.client.multi()
        .hset(cId, msgId, msg)
        .expire(cId, this.expiry)
        .exec(function(err){
            return cb(err, msgId);
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
