var
company = require('./company'),
companyTag = require('./companyTag'),
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

        web.route('vip/company/create', [company.create]);
        web.route('vip/company/read', [company.read]);
        web.route('vip/company/update', [company.update]);
        web.route('vip/company/remove', [company.remove]);

        web.route('vip/follow/create', [follow.create]);
        web.route('vip/follow/read', [follow.read]);
        web.route('vip/follow/remove', [follow.remove]);

        web.route('vip/companyTag/create', [companyTag.create]);
        web.route('vip/companyTag/read', [companyTag.read]);
        web.route('vip/companyTag/update', [companyTag.update]);
        web.route('vip/companyTag/remove', [companyTag.remove]);

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
