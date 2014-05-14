var
baseChannelStorage = require('../../../../elements/channelStorage'),
channelStorage = Object.create(baseChannelStorage.prototype);
channelStorage.setup = function(context, next){
    Object.getPrototypeOf(this).setup(context.redisChannel, 10 * 60);
    next();
}

module.exports = channelStorage;
