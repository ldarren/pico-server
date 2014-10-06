require('./const')
var
data = require('./data'),
user = require('./user'),
vehicle = require('./vehicle'),
job = require('./job'),
invoice = require('./invoice'),
listener = require('./listener'),
sep = function(session, order, next){console.log('###'); return next()},
all = {
    setup: function(context, next){
        var web = context.webServer

        web.route('tr/user/signin', [user.signin])
        web.route('tr/user/signup', [user.signup, listener.update])
        web.route('tr/user/edit', [user.verify, user.edit, listener.update])
        web.route('tr/user/remove', [user.verify, user.remove, listener.update])
        web.route('tr/data/poll', [user.verify, data.poll])
        web.route('tr/data/list', [user.verify, data.list])
        web.route('tr/data/create', [user.verify, data.create, listener.update])
        web.route('tr/data/update', [user.verify, data.getType, data.update, listener.update])
        web.route('tr/data/delete', [user.verify, data.getType, data.remove])
        web.route('tr/invoice/read', [user.verify, invoice.read])
        next()
    }
}

module.exports = [
    all,
    data,
    user,
    vehicle,
    job,
    invoice,
    listener
]
