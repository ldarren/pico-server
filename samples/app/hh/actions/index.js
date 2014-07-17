var
patient = require('./patient'),
result = require('./result'),
issue = require('./issue'),
transfer = require('./transfer'),
constant = require('./constant'),
history = require('./history'),
router = {
    setup: function(context, next){
        var web = context.webServer
        web.setChannelStorage(require('../models/redis/channelStorage'))

        web.route('hh/crr/list', [issue.byDoctor, result.byIssue, issue.filterByResult, patient.byIssue])
        web.route('hh/transfer/list', [transfer.byDoctor, issue.byTransfer, patient.byIssue])
        web.route('hh/history/list', [history.byPatient, issue.byHistory, result.byHistory])

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
    history
]
