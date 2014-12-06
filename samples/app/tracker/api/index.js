require('./const')
var
data = require('./data'),
user = require('./user'),
vehicle = require('./vehicle'),
job = require('./job'),
report = require('./report'),
expense = require('./expense'),
listener = require('./listener'),
notifier = require('./notifier'),
sep = function(session, order, next){console.log('###'); return next()},
all = {
    setup: function(context, next){
        var web = context.webServer

        web.route('tr/user/signin', [user.signin])
        web.route('tr/user/signup', [user.signup, listener.update, notifier.broadcast])
        web.route('tr/data/poll', [user.verify, data.poll])
        web.route('tr/data/list', [user.verify, data.list])
        web.route('tr/data/create', [user.verify, data.create, listener.update, notifier.broadcast])
        web.route('tr/data/update', [user.verify, data.getType, data.update, listener.update, notifier.broadcast])
        web.route('tr/data/remove', [user.verify, data.getType, data.remove])
        web.route('tr/report/read', [user.verify, report.read])
        next()
    }
}

module.exports = [
    all,
    data,
    user,
    vehicle,
    job,
    report,
    listener,
    notifier,
    expense
]
