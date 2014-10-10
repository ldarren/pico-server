const
MODEL = 'job',
Random = Math.random,
Ceil = Math.ceil

var
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
editRights = function(jobId, updatedBy, cb){
    sqlMap.getVals(jobId, ['job', 'code'], function(err, result){
        if (err) return cb(err)
        var
        job = result['job'],
        code = result['code']

        if (!job || !job.length) return cb(G_CERROR[400])

        var
        j = job[0],
        state = parseInt(j.val),
        createdBy = j.createdBy
        sqlMap.getVal(updatedBy, 'user', function(err, result){
            if (err) return cb(err)
            if (!result.length) return cb(G_CERROR[400])
            var role = parseInt(result[0].val)

            switch(state){
            case G_JOB_STATE.OPEN:
                if (createdBy === updatedBy) return cb(null, [state, G_JOB_STATE.CANCEL], createdBy)
                else if (role >= G_USER_TYPE.ADMIN) return cb(null, [state, G_JOB_STATE.CANCEL, G_JOB_STATE.SCHEDULE], createdBy)
                else return cb(G_CERROR[400])
                break
            case G_JOB_STATE.SCHEDULE:
                if (createdBy === updatedBy) return cb(null, [state, G_JOB_STATE.CANCEL], createdBy)
                else if (role === G_USER_TYPE.DRIVER) return cb(null, [state,G_JOB_STATE.START], createdBy)
                else if (role >= G_USER_TYPE.ADMIN) return cb(null, [state, G_JOB_STATE.CANCEL, G_JOB_STATE.START], createdBy)
                else return cb(G_CERROR[400])
                break
            case G_JOB_STATE.START:
                if (!code || !code.length) return cb(G_CERROR[400])
                if (role === G_USER_TYPE.DRIVER) return cb(null, [G_JOB_STATE.STOP], createdBy, code[0].val)
                else if (role >= G_USER_TYPE.ADMIN) return cb(null, [state, G_JOB_STATE.CANCEL, G_JOB_STATE.STOP], createdBy, code[0].val)
                else return cb(G_CERROR[400])
                break
            case G_JOB_STATE.STOP:
                if (role >= G_USER_TYPE.ADMIN) return cb(null, [state, G_JOB_STATE.CANCEL, G_JOB_STATE.CLOSE], createdBy)
                else return cb(G_CERROR[400])
                break
            default: return cb(G_CERROR[400])
            }
        })
    })
}

module.exports = {
    setup: function(context, next){
        next()
    },
    create: function(session, order, next){
        var createdBy = order.id
        sqlMap.getVal(createdBy, 'user', function(err, result){
            if (err) return next(err)
            if (result[0].val < G_USER_TYPE.CUSTOMER) return next(G_CERROR[401])
            sqlData.create(order.type, createdBy, function(err, result){
                if(err) return next(err)
                var
                dataId = result.insertId,
                json={},job=G_JOB_STATE.OPEN
                for(var k in order){
                    switch(k){
                    case 'type':
                    case 'token':
                    case 'id':
                    case 'job': break
                    default: json[k] = order[k]
                    }
                }
                json = JSON.stringify(json)
                sqlMap.set(dataId, {job:job,json:json}, createdBy, function(err){
                    if(err) return next(err)
                    session.getModel(G_MODEL.JOB)[G_MODEL.JOB] = {
                        id:dataId,
                        job:''+job,
                        type:order.type,
                        status: 1,
                        json:json,
                        createdBy:createdBy
                    }
                    session.addJob([session.subJob(G_MODEL.JOB, G_MODEL.JOB)])
                    var l = session.getModel(G_MODEL.LISTENER)
                    l.seen=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN]
                    l.dataId=dataId
                    next()
                })
            })
        })
    },
    update: function(session, order, next){
        var
        updatedBy = order.id,
        jobId = order.dataId,
        newState = parseInt(order.job)
        editRights(jobId, updatedBy, function(err, rights, createdBy, code){
            if (err) return next(err)
            if (-1 === rights.indexOf(newState)) return next(G_CERROR[401])
            var 
            json={},
            params={job:order.job}
            for(var k in order){
                switch(k){
                case 'type':
                case 'token':
                case 'id':
                case 'job':
                case 'code': break
                default: json[k] = order[k]
                }
            }
            switch(newState){
            case G_JOB_STATE.SCHEDULE:
                if (!json.vehicle || !json.driver || !json.charge) return next(G_CERROR[400])
                params.code = Ceil(Random()*9999)
                break
            case G_JOB_STATE.STOP:
console.log('stop', json.verify, code)
                if (!json.verify|| code != json.verify) return next(G_CERROR[400])
                break
            }
            params.json = JSON.stringify(json)
            sqlMap.set(jobId, params, updatedBy, function(err){
                if(err) return next(err)
                params.id = jobId
                session.getModel(G_MODEL.JOB)[G_MODEL.JOB] = params
console.log('return', params)
                session.addJob([session.subJob(G_MODEL.JOB, G_MODEL.JOB)])
                var l = session.getModel(G_MODEL.LISTENER)
                l.dataId=jobId
                l.seen=[G_USER_TYPE.SUPER, G_USER_TYPE.ADMIN]
                l.seenBy=[createdBy]
                if (json.driver) l.seenBy.push(parseInt(json.driver))
                next()
            })
        })
    },
    remove: function(session, order, next){
        var
        updatedBy = order.id,
        jobId = order.dataId,
        newState = order.job
        editRights(jobId, updatedBy, function(err, rights){
            if (err) return next(err)
            if (-1 === rights.indexOf(newState)) return next(G_CERROR[400])
            sqlData.remove(jobId, updatedBy, function(err){
                if(err) return next(err)
                sqlRef.removeRefAll(jobId, next())
            })
        })
    }
}
