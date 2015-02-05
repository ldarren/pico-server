var
BaseData = require('../../../../../elements/sqlHelper/data'),
UserData = function(){}

UserData.prototype = new BaseData

var userData  = new UserData

userData.setup = function(context, next){
    BaseData.prototype.setup.call(this, context.sqlCreator, next)
}

module.exports = userData
