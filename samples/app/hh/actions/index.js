var
patient = require('./patient'),
result = require('./result'),
issue = require('./issue'),
transfer = require('./transfer'),
constant = require('./constant'),
router = {
    setup: function(context, next){
        var web = context.webServer
        web.setChannelStorage(require('../models/redis/channelStorage'))

        web.route('hh/crr/list', [issue.byDoctor, result.byIssue, issue.filterByResult, patient.byIssue])
        web.route('hh/transfer/list', [transfer.byDoctor, issue.byTransfer, patient.byIssue, constant.list])

        next()
    }
}

module.exports = [
    router,
    constant,
    patient,
    issue,
    result,
    transfer,
    require('./history'),
]
