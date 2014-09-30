const MODEL = 'job'

var
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref'),
editRights = function(jobId, updatedBy, cb){
    sqlMap.getVal(jobId, 'job', function(err, result){
        if (err) return cb(err)
        if (!result.length) return cb(G_CERROR[400])
        var
        job = result[0]
        state = job.val,
        createdBy = job.createdBy
        sqlMap.getVal(updatedBy, 'user', function(err, result){
            if (err) return cb(err)
            if (!result.length) return cb(G_CERROR[400])
            var role = result[0].val

            switch(state){
            case G_JOB_STATE.OPEN:
                if (createdBy === updatedBy) return cb(null, [state, G_JOB_STATE.CANCEL])
                else if (role >= G_USER_TYPE.ADMIN) return cb(null, [state, G_JOB_STATE.CANCEL, G_JOB_STATE.SCHEDULE])
                else return cb(G_CERROR[400])
                break
            case G_JOB_STATE.SCHEDULE:
                if (createdBy === updatedBy) return cb(null, [ G_JOB_STATE.CANCEL])
                else if (role === G_USER_TYPE.DRIVER) return cb(null, [G_JOB_STATE.START])
                else if (role >= G_USER_TYPE.ADMIN) return cb(null, [state, G_JOB_STATE.CANCEL, G_JOB_STATE.START])
                else return cb(G_CERROR[400])
                break
            case G_JOB_STATE.START:
                if (role === G_USER_TYPE.DRIVER) return cb(null, [G_JOB_STATE.STOP])
                else if (role >= G_USER_TYPE.ADMIN) return cb(null, [state, G_JOB_STATE.CANCEL, G_JOB_STATE.STOP])
                else return cb(G_CERROR[400])
                break
            case G_JOB_STATE.STOP:
                if (role >= G_USER_TYPE.ADMIN) return cb(null, [state, G_JOB_STATE.CANCEL, G_JOB_STATE.CLOSE])
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
        sqlMap.getVal(updatedBy, 'user', function(err, result){
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
                        job:job,
                        json:json
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
        newState = order.job
        editRights(jobId, updatedBy, function(err, rights){
            if (err) return next(err)
            if (-1 === rights.indexOf(newState)) return cb(G_CERROR[401])
            var json={}
            for(var k in order){
                switch(k){
                case 'type':
                case 'token':
                case 'id':
                case: 'job': break
                default: json[k] = order[k]
                }
            }
            json = JSON.stringify(json)
            sqlMap.set(jobId, {job:newState, json:json}, updatedBy, function(err){
                if(err) return next(err)
                session.getModel(G_MODEL.JOB)[G_MODEL.JOB] = {
                    id:jobId,
                    json:json
                }
                session.addJob([session.subJob(G_MODEL.JOB, G_MODEL.JOB)])
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
