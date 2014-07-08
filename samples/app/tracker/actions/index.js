var
job = require('./job'),
vehicle = require('./vehicle'),
driver = require('./driver'),
router = {
    setup: function(context, next){
        var web = context.webServer

        web.setChannelStorage(require('../models/redis/channelStorage'))

        web.route('tracker/job/create', [job.create])
        web.route('tracker/job/read', [job.read, job.httpOut])
        web.route('tracker/job/update', [job.update])
        web.route('tracker/invoice/download', [job.read, job.docxOut])

        web.route('tracker/vehicle/read', [vehicle.read])
        web.route('tracker/driver/read', [driver.read])
        
        next()
    }
}

module.exports = [
    require('./defaults'),
    router
]
