// TODO:
// 1) remove session and logging from web?
const
JOB_MODEL_INFOS = 0,
JOB_FUNC = 1,
JOB_CONTEXT = 2,
JOB_MODELS = 3,
DELAY_ERROR = 10000,
SESSION_KEYWORDS = ['RES','ACKS','JOBS','USEC','CID'],
SESSION_RES = SESSION_KEYWORDS[0],
SESSION_ACKS = SESSION_KEYWORDS[1],
SESSION_JOBS = SESSION_KEYWORDS[2],
SESSION_TIME = SESSION_KEYWORDS[3],
SESSION_CHANNEL_ID = SESSION_KEYWORDS[5],
PICO_CHANNEL_ID = 'picoChannelId',
NO_CHANNEL = 'no_channel',
PICO_HEADERS = {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
}

var
http = require('http'),
https = require('https'),
cluster = require('cluster'),
domain = require('domain'),
url = require('url'),
fs = require('fs'),
path = require('path'),
querystring = require('querystring'),
crypto = require('crypto'),
multipart = require('./multipart'),
bodyparser = require('./bodyparser'),
processGroups = {ack:[removeAck]},
connMap = {},
config  = {},
channelStorage = null,
secretKey = null,cullAge = 0,delimiter = '',uploadWL=[],
web = {
    route: function(api, funcs){
        if (processGroups[api]){
            console.error('route api['+api+'] already taken')
            return
        }
        processGroups[api] = funcs
    },
    setChannelStorage: function(storage){
        channelStorage = storage
        console.log('web server channel support {',channelStorage ? 'enabled' : 'disabled','}')
    },
    retainChannel: function(session){
        if (!channelStorage) return false
        var
        channelId = session[SESSION_CHANNEL_ID],
        res = session[SESSION_RES]

        if (!res || !res.writable || !channelId) return false
        connMap[channelId] = session
        res.setTimeout(1000*60*5, dc) 
        return true
    },
},
// ref: http://nodejs.org/api/domain.html#domain_warning_don_t_ignore_errors
onDomainError = function(res, err){
    console.error('Domain Error', err.stack)

    try {
        setTimeout(function() { process.exit(1) }, 30000).unref()

        if (cluster.isWorker) cluster.worker.disconnect()

        showErr(res, res[PICO_CHANNEL_ID], err)
    } catch (exp) {
        console.error('Domain Exception!', exp.stack)
    }
},
onConnect = function(req, res){
    var now = Date.now()
    res.writeHead(200, PICO_HEADERS)
    switch(req.method){
    case 'POST': break
    case 'OPTIONS': return res.end()
    case 'GET': return res.end(''+now)
    default: return res.setTimeout(DELAY_ERROR)
    }
    if (-1 === req.headers['content-type'].toLowerCase().indexOf('multipart/form-data')){
        bodyparser.parse(req, function(err, orders){
            if (err){
                console.error(err)
                return res.setTimeout(DELAY_ERROR)
            }
            reply(req, res, orders, now)
        })
    }else{
        multipart.parse(req, function(err, order){
            if (err || !order.api){
                console.error(err || 'empty multipart api')
                return res.setTimeout(DELAY_ERROR)
            }
            reply(req, res, [order.channel ? [order.channel] : [], order], now)
        })
    }
},
reply = function(req, res, orders, startTime){
    var d = domain.create()
    d.on('error', function(err){ onDomainError(res, err) })
    d.add(req)
    d.add(res)
    d.run(function(){
        getChannelId(orders.shift(), url.parse(req.url, true).pathname, function(err, channelId, channelPass){
            req = undefined
            createSession(res, channelId, startTime, function(err, session){
                if (channelId) {
                    res[PICO_CHANNEL_ID] = session[SESSION_CHANNEL_ID] = channelId
                    res.write(channelId+' '+channelPass)
                }
                res.write(delimiter)//to simplified protocol, always present a delimiter even no channel
console.log('IN', startTime.toString(), res.connection.remoteAddress, channelId || NO_CHANNEL, JSON.stringify(orders))
                factory(session, orders, 0, function(err, order){
                    if (err) return showErr(res, channelId, err, order)
                    showChannel(session, channelId, function(err){
                        res.end()
                    })
                })
            })
        })
    })
},
getChannelId = function(channel, path, cb){
    if (!channelStorage) return cb()

    var channelId, channelPass

    if (channel.length){
        var idpass = channel[0].split(' ')
        channelId = idpass[0]
        channelPass = idpass[1]
    }
    if (channelId && isFinite(channelId)) {
        channelStorage.renewChannelId(channelId, channelPass, function(err, channelId, channelPass){
            if (err) return channelStorage.newChannelId(cb)
            cb(null, channelId, channelPass)
        })
        return
    }
    if ('/channel' === path){
        return channelStorage.newChannelId(cb)
    }
    cb()
},
createSession = function(res, channelId, time, cb){
    if (channelId && channelStorage){
        channelStorage.retrieveMsgIds(channelId, function(err, acks){
            if (err){
                console.error('createSession error',err)
            }
            cb(null, new Session(res, time, acks))
        })
    }else{
        cb(null, new Session(res, time, null))
    }
},
Session = function(res, time, acks){
    this[SESSION_RES] = res
    this[SESSION_ACKS] = acks
    this[SESSION_JOBS] = []
    this[SESSION_TIME] = time || Date.now()
},
// modelInfos = [[[userData,3],[mapData,ab1]],[[userData,5],[mapData,bb3]]]
// params = [[userData:3, mapData:ab1],[userData:5, mapData:bb3]]
deref = function(session, modelInfos){
    var params = []

    if (!modelInfos || !modelInfos.length) return params

    var modelInfo,info,value,model,j,k

    for(var i=0, l=modelInfos.length; i<l; i++){
        modelInfo = modelInfos[i]
        value = []
        for(j=0, k=modelInfo.length; j<k; j++){
            info = modelInfo[j]
            model = session.getModel(info[0])
            if (!model) continue
            value.push(model[info[1]])
        }
        params.push(value)
    }
    return params
},
dbExec = function(context, func, modelss, index, cb){
    if (!modelss || !modelss.length || modelss.length === index) return cb()

    var models = modelss[index]
    func.call(context, models, function(err, newModels){
        if (err) {
            console.error(err)
            return cb(G_CERROR['500'])
        }
        modelss[index] = newModels // always insert into first model
        dbExec(context, func, modelss, ++index, cb)
    })
},
dbUpdate = function(session, index, jobs, cb){
    if (index >= jobs.length) return cb()

    var
    job = jobs[index],
    func = job[JOB_FUNC]

    if (!func) return dbUpdate(session, ++index, jobs, cb)

    var
    modelInfos = job[JOB_MODEL_INFOS],
    models = deref(session, modelInfos)

    job[JOB_MODELS] = models

    dbExec(job[JOB_CONTEXT], func, models, 0, function(err){
        if (err) return cb(err)
        dbUpdate(session, ++index, jobs, cb)
    })
},
commitSession = function(session, order, cb){
    dbUpdate(session, 0, session[SESSION_JOBS], function(err){
        cb(err)
    })
},
pipeline = function(session, context, processList, processIdx, data, cb){
    if (!processList || processIdx >= processList.length) return cb()
    var process = processList[processIdx]
    if (!process) {
        console.error(context,':',processIdx, 'is undefined')
        return cb(G_CERROR['500'])
    }
    process.call(context, session, data, function(err){
        if (err) {
            console.error(err)
            return cb(err.code ? err : G_CERROR['500'])
        }
        pipeline(session, context, processList, ++processIdx, data, cb)
    })
},
factory = function(session, orders, orderIdx, cb){
    if (!orders || !orders.length || orderIdx >= orders.length) return cb()
    var
    order = orders[orderIdx++] || {},
    res = session[SESSION_RES],
    api = order.api
    if (!api) return factory(session, orders, orderIdx, cb)
    var processGroup = processGroups[api]
    if (!processGroup) return cb(G_CERROR['404'], order)

    pipeline(session, {api:api}, processGroup, 0, order.data, function(err){
        if (err) return cb(err, order)
        commitSession(session, order, function(err){
            if (err) return cb(err, order)
            showView(session, order, function(err, packet){
                if (err) return cb(err, order)
                if (packet){
                    res.write(packet)
                    res.write(delimiter)
                }
console.log('OUT', Date.now() - session[SESSION_TIME], res.connection.remoteAddress, session[SESSION_CHANNEL_ID] || NO_CHANNEL, packet || '')
                factory(session, orders, orderIdx, cb)
            })
        })
    })
},
renderView = function(session, jobs, product, cb){
    if (!jobs.length) return cb(null, product)
    var job = jobs.shift()
    if (!job) return renderView(session, jobs, product, cb)

    var modelInfos = job[JOB_MODEL_INFOS]
    if (!modelInfos || !modelInfos.length || !modelInfos[0].length) return renderView(session, jobs, product, cb)

    var modelss = job[JOB_MODELS] || deref(session, modelInfos) // read job has no JOB_MODELS

    for (var i=0, l=modelss.length, model, modelInfo; i<l; i++){
        model = modelss[i][0]
        modelInfo = modelInfos[i][0]
        product[modelInfo[1]] = model // modelInfo = [modelId, key]
    }
    return renderView(session, jobs, product, cb)
},
showErr = function(res, channelId, err, order){
    // TODO: better error handling
    order = order || {}
    var
    str = JSON.stringify(err),
    t = Date.now(),
    head = secretKey ? {
        api: order.api || '',
        reqId: order.reqId || 0,
        resId: 0,
        len: 0,
        date: t,
        key: crypto.createHmac('md5', secretKey+t).update(str).digest('base64'),
        error:null
    } : {
        api: order.api || '',
        reqId: order.reqId || 0,
        resId: 0,
        len: 0,
        error:null
    },
    packet = JSON.stringify(head).replace('null',str)

console.error('ERR', res.connection.remoteAddress, channelId || NO_CHANNEL, packet)
    res.write(packet)
    res.end(delimiter)
},
showView = function(session, order, cb){
    if (!order.reqId) return cb() // client not expecting reply

    var
    channelId = session[SESSION_CHANNEL_ID],
    jobs = session[SESSION_JOBS]

    if (!jobs) return cb(G_CERROR['400'])

    renderView(session, jobs, {}, function(err, data){
        if (err){
            console.error(err)
            return cb(G_CERROR['400'])
        }

        var
        t = Date.now(),
        keys = Object.keys(data),
        body = [],
        head

        switch(keys.length){
        case 0: data = undefined; break
        case 1: data = data[keys[0]]
                // through
        default:
            body.unshift(JSON.stringify(data, function(k, v){
                switch(k){
                case 'json':
                case 'blob': return body.push(v)
                default: return v
                }
            }))
        }
            
        if(secretKey) {
            var hmac = crypto.createHmac('md5', secretKey+t)
            for(var i=0,l=body.length; i<l; i++) hmac.update(body[i]);
            head = {
                api: order.api,
                reqId: order.reqId,
                resId: 0,
                len: body.length, 
                date: t,
                key: hmac.digest('base64')
            }
        }else{
            head = {
                api: order.api,
                reqId: order.reqId,
                resId: 0,
                len: body.length 
            }
        }

        if (channelId && channelStorage){
            channelStorage.newMessageId(channelId, function(err, resId){
                if (err) console.error(err) // must send even if error occured
                head.resId = resId
                body.unshift(JSON.stringify(head))

                var packet = body.join(delimiter)
                channelStorage.storeMessage(channelId, resId, packet, function(err){
                    if (err) console.error(err) // must send even if error occured
                    cb(null, packet)
                })
            })
            return
        }
        body.unshift(JSON.stringify(head))
        cb(null, body.join(delimiter))
    })
},
showChannel = function(session, channelId, cb){
    var acks = session[SESSION_ACKS]
    if (!channelStorage || !channelId || !acks || !acks.length) return cb()

    channelStorage.retrieveMessages(channelId, acks, function(err, packetList){
        if (err) return cb(err)
        var
        res = session[SESSION_RES],
        packet
        for(var i=0,l=packetList.length; i<l; i++){
            packet = packetList[i]
            if (packet){
                res.write(packet)
                res.write(delimiter)
console.log('BUF', res.connection.remoteAddress, channelId, packet)
            }
        }
        cb()
    })
},

updateChannel = function(channelIds, cb){
/*    if (!channelIds || !channelIds.length) return cb()
    var
    channelId = channelIds.pop(),
    session = connMap[channelId]
    if (!session) return updateChannel(channelIds, cb)

    channelStorage.getMessages(channelId, function(err, orders){
        if (err) updateChannel(channelIds, cb)
        factory(session, orders, 0, function(err, order){
            process.nextTick(function()(updateChannel(channelIds, cb)))
        })
    })*/
},
update = function(){
/*
    if (!channelStorage) return
    // check for redis update
    var allchannels = Object.keys(connMap)
    channelStorage.getAllRecipients(allChannels, function(err, channelIds){
        updateChannel(channelIds, function(){
            process.nextTick(update)
        })
    })*/
},
dc = function(){
    if (!channelStorage) return
    var channelId = this[PICO_CHANNEL_ID]
    if (!channelId) return
    console.log('dc channelId', channelId)
    delete connMap[channelId]
}

function removeAck(session, order, next){
    if (!channelStorage) return next()
    var
    channelId = session[SESSION_CHANNEL_ID],
    resId = order.resId
    channelStorage.removeMessage(channelId, resId, function(err, removedCount){
        if (removedCount){
            var
            arr = session[SESSION_ACKS],
            i = arr.indexOf(resId)
            arr.splice(i, 1)
        }
        next(err)
    })
}

function pinPointCaller(_, stack){
    var r = stack[0]
    return '['+(r.getFunctionName() || r.getTypeName()+'.'+r.getMethodName()) +'@'+r.getFileName() + ':' + r.getLineNumber() + ':' + r.getColumnNumber()+']'
}
Session.prototype = {
    log: function(){
        var
        originPrepare = Error.prepareStackTrace,
        originCount = Error.stackTraceLimit

        Error.prepareStackTrace = pinPointCaller
        Error.stackTraceLimit = 1

        var err = new Error
        Error.captureStackTrace(err, arguments.callee)
        var params = [(new Date).toISOString(), err.stack]
        console.log.apply(console, params.concat(Array.prototype.slice.call(arguments)))

        Error.prepareStackTrace = originPrepare
        Error.stackTraceLimit = originCount
    },
    error: function(){
        var originCount = Error.stackTraceLimit

        Error.stackTraceLimit = 4

        var err = new Error
        Error.captureStackTrace(err, arguments.callee)
        var params = [(new Date).toISOString()]
        params = params.concat(Array.prototype.slice.call(arguments))
        params.push('\n')
        console.error.apply(console, params.concat(err.stack))

        Error.stackTraceLimit = originCount
    },
    getModel: function(modelId){
        if (-1 !== SESSION_KEYWORDS.indexOf(modelId)) return console.error('Session.getModel("'+modelId+'") collide with session keyword')
        return this[modelId] = this[modelId] || {}
    },
    // main model must be set at modelInfos[0][0], modelInfos = [[[MID, key],[MID, key]],[[MID, key]]]
    addJob: function(modelInfos, func, context){
        if (modelInfos){
            var i,l,j,k,mis,mi,mid,key
            for(i=0,l=modelInfos.length;i<l;i++){
                mis = modelInfos[i]
                for(j=0,k=mis.length; j<k; j++){
                    mi = mis[j]
                    if (!mi || mi.length < 2) return this.error('Exception! undefined modelId or key', JSON.stringify(modelInfos))
                    mid = mi[0]
                    key = mi[1]
                    if (-1 !== SESSION_KEYWORDS.indexOf(mid)) return console.error('Session.getModel("',mid,'") collide with session keyword')
                    if (undefined === this[mid] || undefined === this[mid][key]) return this.error('Exception!', mid, 'or', key, 'not found in session')
                }
            }
        }
        this[SESSION_JOBS].push(Array.prototype.slice.call(arguments))
    },
    subJob: function(){
        var subJob = []
        for(var i=0,l=arguments.length; i<l;){
            subJob.push([arguments[i++],arguments[i++]])
        }
        return subJob
    }
}

exports.init = function(appConfig, libConfig, next){
    var
    path1 = libConfig.pfxPath,
    path2 = appConfig.path + path.sep + path1,
    isPath1 = fs.existsSync(path1),
    isPath2 = path1 ? fs.existsSync(path2) : false, 
    pfx = (isPath1 ? path1 : (isPath2 ? path2 : null)),
    server = pfx ? https.createServer({pfx: fs.readFileSync(pfx)}, onConnect) : http.createServer(onConnect)

    server.listen(libConfig.port, function(){
        config = libConfig
        secretKey = config.secretKey || null
        cullAge = config.cullAge
        delimiter = config.delimiter ? JSON.stringify(config.delimiter) : '' 
        if (config.allowOrigin) PICO_HEADERS['Access-Control-Allow-Origin'] = config.allowOrigin
        uploadWL = config.uploadWL || []

        multipart.setup(uploadWL)
        bodyparser.setup(cullAge, secretKey, delimiter)

        console.log('web server hash check{',secretKey ? 'enabled' : 'disabled','}')
        console.log('web server cull age +- milliseconds {',cullAge ? cullAge : 'disabled','}')
        console.log('web server delimiter {',delimiter,'}')
        console.log('web server upload white list{',uploadWL,'}')
        console.log('web server allow origin {',PICO_HEADERS['Access-Control-Allow-Origin'],'}')
        console.log('web server listening to', (pfx ? 'https' : 'http'), config.port)

        next(null, web)

        update()
    })
}
