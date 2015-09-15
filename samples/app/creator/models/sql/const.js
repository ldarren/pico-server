var BaseConst = require('../../../../../elements/sqlHelper/hash1')

exports.setup = function(context, next){
    BaseConst.setup(context.sqlCreator, next)
}
