var BaseConst = require('../../../../../elements/sqlHelper/const')

exports.setup = function(context, next){
    BaseConst.setup(context.sqlCreator, next)
}
