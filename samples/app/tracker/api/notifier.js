var
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
common = require('pico-common'),
notifier

module.exports = {
    setup: function(context, next){
        notifier = context.trackerNotifier
        next()
    },
    broadcast: function(session, order, next){
        var
        senderId = order.id,
        c = session.getModel(G_MODEL.NOTIFIER)
        sqlRef.getRefTo(c.dataId, function(err, result){
            if (err) return console.error(err)
            var
            recipients = common.pluck(result, 'dataId'),
            index = recipients.indexOf(senderId)
            if (-1 !== index) recipients.splice(index, 1)
            if (!recipients.length) return 
            sqlMap.getMultiVals(recipients, ['platform', 'pushToken'], function(err, info){
                if (err) return console.error(err)
                var u, tokens=[], ids=[]
                for(var k in info){
                    u = info[k]
                    if ('apn' === u.platform) tokens.push(u.pushToken)
                    else ids.push(u.pushToken)
                }
                notifier.broadcast(tokens, ids, c.title, c.msg)
            })
        })
        next()
    }
}
