var
BaseRef = require('../../../../../elements/sqlHelper/ref'),
UserRef = function(){}

UserRef.prototype = new BaseRef

var userRef  = new UserRef

userRef.setup = function(context, next){
    BaseRef.prototype.setup.call(this, context.sqlCreator, next)
}

module.exports = userRef
