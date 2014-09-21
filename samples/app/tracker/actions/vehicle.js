const MODEL = 'vehicle'

var
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref')

module.exports = {
    setup: function(context, next){
        next()
    },
    add: function(session, order, next){
    },
    remove: function(session, order, next){
    }
}
