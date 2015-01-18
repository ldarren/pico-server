require('./const')
var
data = require('./data'),
user = require('./user'),
listener = require('./listener'),
notifier = require('./notifier'),
sep = function(session, order, next){console.log('###'); return next()},
all = {
    setup: function(context, next){
        var web = context.webServer

        web.route('cr/user/signin', [user.signin])
        web.route('cr/user/signup', [user.signup, listener.update, notifier.broadcast])
        web.route('cr/data/poll', [user.verify, data.poll])
        web.route('cr/data/list', [user.verify, data.list])
        web.route('cr/data/create', [user.verify, data.create, listener.update, notifier.broadcast])
        web.route('cr/data/update', [user.verify, data.getType, data.update, listener.update, notifier.broadcast])
        web.route('cr/data/remove', [user.verify, data.getType, data.remove])
        next()
    }
}

module.exports = [
    all,
    data,
    user,
    listener,
    notifier
]
