var
user = require('./user'),
all = {
    setup: function(context, next){
        var web = context.webServer

        web.route('tr/user/read', [user.read])
        next()
    }
}

module.exports = [
    all,
    user
]
