var
sqlShop = require('../models/sql/shop');
web = null,
listResponse = function(session, order, next){
    sqlShop.getAll(function(err, result){
        if (err) return next(err);

        var model = session.getModel('shop');
        model['all'] = result;
        session.addJob(
            G_PICO_WEB.RENDER_FULL,
            [[session.createModelInfo('shop', 'all')]]
        );

        next();
    });
},
router = {
    setup: function(context, next){
        web = context.webServer;

        web.setChannelStorage(require('../models/redis/channelStorage'));
        
        web.route('vip/shop/list', [listResponse]);

        next();
    }
};

module.exports = [
    router
];
