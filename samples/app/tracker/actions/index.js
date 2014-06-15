var
job = require('./job'),
vehicle = require('./vehicle'),
driver = require('./driver'),
jobType = require('./jobType'),
paymentType = require('./paymentType'),
router = {
    setup: function(context, next){
        var web = context.webServer;

        web.setChannelStorage(require('../models/redis/channelStorage'));
        
        web.route('tracker/job/create', [job.create]);
        web.route('tracker/job/read', [job.read]);
        web.route('tracker/job/update', [job.update]);

        web.route('tracker/vehicle/read', [vehicle.read]);
        web.route('tracker/driver/read', [driver.read]);
        web.route('tracker/jobType/read', [jobType.read]);
        web.route('tracker/paymentType/read', [paymentType.read]);

        next();
    }
};

module.exports = [
    router
];
