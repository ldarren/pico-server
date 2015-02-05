var
BaseMap = require('../../../../../elements/sqlHelper/map'),
UserMap = function(){}

UserMap.prototype = new BaseMap

var userMap  = new UserMap

userMap.setup = function(context, next){
    BaseMap.prototype.setup.call(this, context.sqlCreator, ['un', 'passwd', 'token', 'platform', 'pushToken'], next)
}

module.exports = userMap
