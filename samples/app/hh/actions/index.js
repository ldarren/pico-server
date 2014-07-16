var
patient = require('./patient'),
result = require('./result'),
issue = require('./issue'),
transfer = require('./transfer'),
router = {
    setup: function(context, next){
        var web = context.webServer
        web.setChannelStorage(require('../models/redis/channelStorage'))

        web.route('hh/crr/list', [issue.byDoctor, result.byIssue, issue.filterByResult, patient.byIssue])
        web.route('hh/transfer/list', [transfer.byDoctor, issue.byTransfer, patient.byIssue])

        next()
    }
}

module.exports = [
    router,
    patient,
    issue,
    result,
    transfer,
    require('./constant'),
    require('./history'),
]
