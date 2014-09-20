var
user = require('./user'),
all = {
    setup: function(context, next){
        var web = context.webServer

        web.route('tr/user/signin', [user.signin])
        web.route('tr/user/signup', [user.signup])
        next()
    }
}

module.exports = [
    all,
    user
]
