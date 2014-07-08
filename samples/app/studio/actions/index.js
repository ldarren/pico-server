var
router = {
    setup: function(context, next){
        var web = context.webServer
        web.setChannelStorage(require('../models/redis/channelStorage'))

        next()
    }
}

module.exports = [
    router,
    require('./project'),
    require('./widget'),
]
