var
BaseList = require('../../../../../elements/sqlHelper/list'),
UserList = function(){}

UserList.prototype = new BaseList

var userList  = new UserList

userList.setup = function(context, next){
    BaseList.prototype.setup.call(this, context.sqlCreator, next)
}

module.exports = userList
