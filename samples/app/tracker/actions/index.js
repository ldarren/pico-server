var
user = require('./user'),
all = {
    setup: function(context, next){
        var web = context.webServer

        web.route('tk/user/create', [user.create])
        next()
    }
}

module.exports = [
    all,
    user
]
