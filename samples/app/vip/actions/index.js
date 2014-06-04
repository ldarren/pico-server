var
business = require('./business'),
businessTag = require('./businessTag'),
device = require('./device'),
flyer = require('./flyer'),
follow = require('./follow'),
user = require('./user'),
router = {
    setup: function(context, next){
        var web = context.webServer;

        web.setChannelStorage(require('../models/redis/channelStorage'));
        
        web.route('vip/user/create', [user.create, device.update]);
        web.route('vip/user/read', [user.read]);
        web.route('vip/user/update', [user.update]);

        web.route('vip/device/update', [device.update]);

        web.route('vip/business/create', [business.create]);
        web.route('vip/business/read', [business.read]);
        web.route('vip/business/update', [business.update]);
        web.route('vip/business/remove', [business.remove]);

        web.route('vip/follow/create', [follow.create]);
        web.route('vip/follow/read', [follow.read]);
        web.route('vip/follow/remove', [follow.remove]);

        web.route('vip/businessTag/create', [businessTag.create]);
        web.route('vip/businessTag/read', [businessTag.read]);
        web.route('vip/businessTag/update', [businessTag.update]);
        web.route('vip/businessTag/remove', [businessTag.remove]);

        web.route('vip/flyer/create', [flyer.create]);
        web.route('vip/flyer/read', [flyer.read]);
        web.route('vip/flyer/update', [flyer.update]);
        web.route('vip/flyer/remove', [flyer.remove]);

        next();
    }
};

module.exports = [
    router
];
