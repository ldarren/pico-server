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
url = require('url'),
fs = require('fs'),
path = require('path'),
querystring = require('querystring'),
crypto = require('crypto'),
upload = require('./upload'),
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
parseHeader = function(k, v){
    if ('data' === k) return JSON.stringify(v)
    return v
},
parseJson = function(req, cb){
    var data = ''
    req.on('data', function(chunk){ data += chunk })
    req.on('end', function(){
        var orders
        try{
            var json = JSON.parse(data, parseHeader)
            if (json.orders) orders = json.orders // some situation parent array is invalid
            else orders = json
        }catch(exp){
            error('json parsing exception', exp, '[',data,']')
        }finally{
            data = json = undefined
            if (orders){
                auth(orders, 1, function(err, order){
                    if (err) cb('failed auth '+JSON.stringify(order)+' err: '+err)
                    cb(null, orders)
                })
            }else{
                cb('missing or invalid orders')
            }
        }
    })
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
        parseJson(req, function(err, orders){
            if (err){
                console.error(err)
                return res.setTimeout(DELAY_ERROR)
            }
            reply(req, res, orders, now)
        })
    }else{
        upload(req, uploadWL, function(err, order){
            if (err || !order.api){
                console.error(err || 'empty upload api')
                return res.setTimeout(DELAY_ERROR)
            }
            reply(req, res, [order.channel ? [order.channel] : [], order], now)
        })
    }
},
reply = function(req, res, orders, startTime){
    getChannelId(orders.shift(), url.parse(req.url, true).pathname, function(err, channelId, channelPass){
        req = undefined
        createSession(res, channelId, startTime, function(err, session){
            if (channelId) {
                res.write(JSON.stringify([channelId+' '+channelPass]))
                res.write(delimiter)
                res[PICO_CHANNEL_ID] = session[SESSION_CHANNEL_ID] = channelId
            }
console.log('IN', startTime.toString(), res.connection.remoteAddress, channelId || NO_CHANNEL, JSON.stringify(orders))
            factory(session, orders, 0, function(err, order){
                if (err) return showErr(res, channelId, err, order)
                showChannel(session, channelId, function(err){
                    res.end()
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
pipeline = function(session, api, processList, processIdx, data, cb){
    if (!processList || processIdx >= processList.length) return cb()
    var process = processList[processIdx]
    if (!process) {
        console.error(api,':',processIdx, 'is undefined')
        return cb(G_CERROR['500'])
    }
    process(session, data, function(err){
        if (err) {
            console.error(err)
            return cb(err.code ? err : G_CERROR['500'])
        }
        pipeline(session, api, processList, ++processIdx, data, cb)
    })
},
auth = function(orders, orderIdx, cb){
    if (!orders || !orders.length) return cb('malformat orders')
    if (orders.length <= orderIdx) return cb()

    var order = orders[orderIdx++]
    if (!order) return auth(orders, orderIdx, cb)
    var data = order.data
    if (!data) return cb('missing data: '+JSON.stringify(order))

    var
    t = order.date,
    dt = Date.now() - t

    if (cullAge && (!t || dt > cullAge || dt < -cullAge)){
        return cb('timed error request: api['+order.api+']t['+t+']dt['+dt+']', order)
    }

    if (secretKey){
        var key = crypto.createHmac('md5', secretKey+t).update(data).digest('base64')

        if (key !== order.key){
            return cb('key error request: api['+order.api+']t['+t+']key['+key+']', order)
        }
    }
    try{
        order.data = JSON.parse(data)
    }catch(exp){
        return cb(exp, order)
    }
    auth(orders, orderIdx, cb)
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

    pipeline(session, api, processGroup, 0, order.data, function(err){
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
    view = secretKey ? {
        api: order.api || '',
        reqId: order.reqId || 0,
        resId: 0,
        date: t,
        key: crypto.createHmac('md5', secretKey+t).update(str).digest('base64'),
        error:null
    } : {
        api: order.api || '',
        reqId: order.reqId || 0,
        resId: 0,
        error:null
    },
    packet = JSON.stringify(view).replace('null',str)

console.error('ERR', res.connection.remoteAddress, channelId || NO_CHANNEL, packet)
    res.end(packet)
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

        var keys = Object.keys(data)

        data = 1 === keys.length ? data[keys[0]] : data

        var
        t = Date.now(),
        str = JSON.stringify(data),
        view = secretKey ? {
            api: order.api,
            reqId: order.reqId,
            resId: 0,
            date: t,
            key: crypto.createHmac('md5', secretKey+t).update(str).digest('base64'),
            data: null 
        } : {
            api: order.api,
            reqId: order.reqId,
            resId: 0,
            data: null
        }

        if (channelId && channelStorage){
            channelStorage.newMessageId(channelId, function(err, resId){
                if (err) console.error(err) // must send even if error occured
                view.resId = resId

                var packet = JSON.stringify(view).replace('null', str)
                channelStorage.storeMessage(channelId, resId, packet, function(err){
                    if (err) console.error(err) // must send even if error occured
                    cb(null, packet)
                })
            })
            return
        }
        cb(null, JSON.stringify(view).replace('null', str))
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
Session.prototype.log = function(){
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
}
Session.prototype.error = function(){
    var originCount = Error.stackTraceLimit

    Error.stackTraceLimit = 4

    var err = new Error
    Error.captureStackTrace(err, arguments.callee)
    var params = [(new Date).toISOString()]
    params = params.concat(Array.prototype.slice.call(arguments))
    params.push('\n')
    console.error.apply(console, params.concat(err.stack))

    Error.stackTraceLimit = originCount
}
Session.prototype.getModel = function(modelId){
    if (-1 !== SESSION_KEYWORDS.indexOf(modelId)) return console.error('Session.getModel("'+modelId+'") collide with session keyword')
    return this[modelId] = this[modelId] || {}
}
// main model must be set at modelInfos[0][0], modelInfos = [[[MID, key],[MID, key]],[[MID, key]]]
Session.prototype.addJob = function(modelInfos, func, context){
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
}
Session.prototype.subJob = function(){
    var subJob = []
    for(var i=0,l=arguments.length; i<l;){
        subJob.push([arguments[i++],arguments[i++]])
    }
    return subJob
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
