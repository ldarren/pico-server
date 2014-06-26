// TODO:
// 1) remove session and logging from web?
const
JOB_RENDER = 0,
JOB_MODEL_INFOS = 1,
JOB_OBJ = 2,
JOB_FUNC = 3,
JOB_MODELS = 4,
DELAY_ERROR = 10000,
SESSION_KEYWORDS = ['REQ','RES','ACKS','JOBS','USEC','CID'],
SESSION_REQ = SESSION_KEYWORDS[0],
SESSION_RES = SESSION_KEYWORDS[1],
SESSION_ACKS = SESSION_KEYWORDS[2],
SESSION_JOBS = SESSION_KEYWORDS[3],
SESSION_TIME = SESSION_KEYWORDS[4],
SESSION_CHANNEL_ID = SESSION_KEYWORDS[5],
PICO_CHANNEL_ID = 'picoChannelId',
NO_CHANNEL = 'no_channel',
PICO_HEADERS = {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

Object.freeze(GLOBAL.G_PICO_WEB = {
    RENDER_NO: 0,
    RENDER_FULL: 1,
    RENDER_HEADER: 2
})

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
secretKey = null, cullAge = 0,delimiter = false,
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
        console.log('web server channel support [',channelStorage ? 'enabled' : 'disabled',']')
    },
    retainChannel: function(session, req, res){
        if (!channelStorage) return false
        var channelId = session[SESSION_CHANNEL_ID]
        if (!res || !res.writable || !channelId) return false
        var
        conn = {req:req, res:res}
        connMap[idpass[0]] = conn
        res.setTimeout(1000*60*5, dc) 
        return true
    },
},
parseJson = function(req, res, cb){
    var data = ''
    req.on('data', function(chunk){ data += chunk })
    req.on('end', function(){
        var
        now = Date.now(),
        orders
        try{
            var json = JSON.parse(data)
            if (json.orders) orders = json.orders // some situation parent array is invalid
            else orders = json
        }catch(exp){
            console.error('json parsing exception', exp, '[',data,']')
        }finally{
            data = json = undefined
            if (orders){
                auth(orders, 1, function(err, order){
                    if (err){
                        console.error(res.connection.remoteAddress, err, orders)
                        res.setTimeout(DELAY_ERROR, dc, 403)
                        return
                    }
                    cb(req, res, orders, now)
                })
            }else{
                // delay error to prevent ddos
                res.setTimeout(DELAY_ERROR, dc, 400)
            }
        }
    })
},
onConnect = function(req, res){
    res.writeHead(200, PICO_HEADERS)
    switch(req.method){
    case 'POST': break
    case 'OPTIONS': return res.end()
    case 'GET': return res.end(''+Date.now())
    default: return res.setTimeout(DELAY_ERROR, dc, 404)
    }
    if (-1 === req.headers['content-type'].toLowerCase().indexOf('multipart/form-data')){
        parseJson(req, res, reply)
    }else{
        upload(req, function(err, order, now){
            if (err) return res.setTimeout(DELAY_ERROR, dc, 400)
            reply(req, res, [[order.channel], order], now)
        })
    }
},
reply = function(req, res, orders, startTime){
    getChannelId(orders.shift(), url.parse(req.url, true).pathname, function(err, channelId, channelPass){
        res.write(JSON.stringify([channelId+' '+channelPass]))
        createSession(req, res, channelId, startTime, function(err, session){
            if (channelId) {
                res[PICO_CHANNEL_ID] = session[SESSION_CHANNEL_ID] = channelId
            }
session.log(res.connection.remoteAddress, channelId || NO_CHANNEL, orders)
            factory(session, orders, 0, function(err, order){
                if (err) return showErr(session, err, order, res)
                showMsgs(session, channelId, function(err){
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
createSession = function(req, res, channelId, time, cb){
    if (channelId && channelStorage){
        channelStorage.retrieveMsgIds(channelId, function(err, acks){
            if (err){
                console.error('createSession error',err)
            }
            cb(null, new Session(req, res, time, acks))
        })
    }else{
        cb(null, new Session(req, res, time, null))
    }
},
Session = function(req, res, time, acks){
    this[SESSION_REQ] = req
    this[SESSION_RES] = res
    this[SESSION_ACKS] = acks
    this[SESSION_JOBS] = []
    this[SESSION_TIME] = time || Date.now()
},
// modelInfos = [[{modelId:userData,key:3},{modelId:mapData,key:ab1}],[{modelId:userData,key:5},{modelId:mapData,key:bb3}]]
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
            model = session.getModel(info.modelId)
            if (!model) continue
            value.push(model[info.key])
        }
        params.push(value)
    }
    return params
},
dbExec = function(obj, func, modelss, index, cb){
    if (!modelss || !modelss.length || modelss.length === index) return cb()

    var models = modelss[index]
    func.call(obj, models, function(err, newModels){
        if (err) {
            console.error(err)
            return cb(G_CERROR['500'])
        }
        modelss[index] = newModels // always insert into first model
        dbExec(obj, func, modelss, ++index, cb)
    })
},
dbUpdate = function(session, index, jobs, cb){
    if (index >= jobs.length) return cb()

    var
    job = jobs[index],
    obj = job[JOB_OBJ],
    func = job[JOB_FUNC]

    if (!func) return dbUpdate(session, ++index, jobs, cb)

    var
    modelInfos = job[JOB_MODEL_INFOS],
    models = deref(session, modelInfos)

    job[JOB_MODELS] = models

    dbExec(obj, func, models, 0, function(err){
        if (err) return cb(err)
        dbUpdate(session, ++index, jobs, cb)
    })
},
commitSession = function(session, order, cb){
    dbUpdate(session, 0, session[SESSION_JOBS], function(err){
        cb(err)
    })
},
pipeline = function(session, api, processList, processIdx, order, cb){
    if (!processList || processIdx >= processList.length) return cb()
    var process = processList[processIdx]
    if (!process) {
        console.error(api,':',processIdx, 'is undefined')
        return cb(G_CERROR['500'])
    }
    process(session, order, function(err){
        if (err) {
            console.error(err)
            return cb(err.code ? err : G_CERROR['500'])
        }
        pipeline(session, api, processList, ++processIdx, order, cb)
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
    api = order.api
    if (!api) return factory(session, orders, orderIdx, cb)

    var processGroup = processGroups[api]
    if (!processGroup) return cb(G_CERROR['404'], order)

    pipeline(session, api, processGroup, 0, order, function(err){
        if (err) return cb(err, order)
        commitSession(session, order, function(err){
            if (err) return cb(err, order)
            showView(session, order, function(){
                factory(session, orders, orderIdx, cb)
            })
        })
    })
},
renderView = function(session, jobs, product, cb){
    if (!jobs.length) return cb(null, product)
    var job = jobs.shift()
    if (!job) return renderView(session, jobs, product, cb)

    var 
    modelInfos = job[JOB_MODEL_INFOS],
    renderMode = job[JOB_RENDER]
    if (!renderMode || !modelInfos || !modelInfos.length || !modelInfos[0].length) return renderView(session, jobs, product, cb)

    var modelss = job[JOB_MODELS] || deref(session, modelInfos) // read job has no JOB_MODELS

    if (G_PICO_WEB.RENDER_FULL === renderMode){ // 1: render full, 2: render header only
        var model, modelInfo
        for (var i=0, l=modelss.length; i<l; i++){
            model = modelss[i][0]
            modelInfo = modelInfos[i][0]
            product[modelInfo.key] = model
        }
    }
    return renderView(session, jobs, product, cb)
},
showErr = function(session, err, order, res){
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
        error:str
    } : {
        api: order.api || '',
        reqId: order.reqId || 0,
        resId: 0,
        error:str
    },
    packet = JSON.stringify(view)

if(session)session.log(res.connection.remoteAddress, session[SESSION_CHANNEL_ID] || NO_CHANNEL, packet)
    res.end(packet)
    if (delimiter) res.write(delimiter)
},
showView = function(session, order, cb){
    if (!order.reqId) return cb() // client not expecting reply

    var
    res = session[SESSION_RES],
    channelId = session[SESSION_CHANNEL_ID],
    jobs = session[SESSION_JOBS]

    if (!res || !jobs) return cb(G_CERROR['400'])

    renderView(session, jobs, {}, function(err, data){
        if (err){
            console.error(err)
            return cb(G_CERROR['400'])
        }

        var
        t = Date.now(),
        str = JSON.stringify(data),
        view = secretKey ? {
            api: order.api,
            reqId: order.reqId,
            resId: 0,
            data: str,
            key: crypto.createHmac('md5', secretKey+t).update(str).digest('base64'),
            date: t 
        } : {
            api: order.api,
            reqId: order.reqId,
            resId: 0,
            data: str
        },
        packet

        if (channelId && channelStorage){
            channelStorage.newMessageId(channelId, function(err, resId){
                if (err) console.error(err) // must send even if error occured
                view.resId = resId
                packet = JSON.stringify(view)
                channelStorage.storeMessage(channelId, resId, packet, function(err){
                    if (err) console.error(err) // must send even if error occured
                    res.write(packet)
                    if (delimiter) res.write(delimiter)
session.log(res.connection.remoteAddress, channelId, Date.now() - session[SESSION_TIME], packet)
                    return cb()
                })
            })
            return
        }
        packet = JSON.stringify(view)
        res.write(packet)
        if (delimiter) res.write(delimiter)
session.log(res.connection.remoteAddress, NO_CHANNEL, Date.now() - session[SESSION_TIME], packet)
        cb()
    })
},
showMsgs = function(session, channelId, cb){
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
session.log(res.connection.remoteAddress, channelId, packet)
                if (delimiter) res.write(delimiter)
            }
        }
        cb()
    })
},

updateChannel = function(channelIds, cb){
/*    if (!channelIds || !channelIds.length) return cb()
    var
    channelId = channelIds.pop(),
    conn = connMap[channelId]
    if (!conn) updateChannel(channelIds, cb)

    channelStorage.getMessages(channelId, function(err, orders){
        if (err) updateChannel(channelIds, cb)
        factory(conn.req, conn.res, orders, 0, function(err, order){
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
dc = function(error){
    if (error){
        return showErr(null, G_CERROR[error], null, this)
    }
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
    resId = order.data.resId
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
// main model must be set at modelInfos[0][0], modelInfos = [[{modelId:MID, key:xxx},{modelId:MID, key:xxx}],[{modelId:MID, key:xxx}]]
// render = 0:no render, 1: full render, 2: header only
Session.prototype.addJob = function(render, modelInfos, obj, func){
    if (modelInfos){
        var i,l,j,k,mis,mi
        for(i=0,l=modelInfos.length;i<l;i++){
            mis = modelInfos[i]
            for(j=0,k=mis.length; j<k; j++){
                mi = mis[j]
                if (!mi || undefined === mi.modelId || undefined === mi.key) return this.error('Exception! undefined modelId or key', JSON.stringify(modelInfos))
            }
        }
    }
    this[SESSION_JOBS].push(Array.prototype.slice.call(arguments))
}
Session.prototype.createModelInfo = function(modelId, key){
    if (undefined === this[modelId] || undefined === this[modelId][key]) return this.error('Exception!', modelId, 'or', key, 'not found in session')
    return {modelId:modelId, key:key}
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
        delimiter = config.delimiter ? JSON.stringify(config.delimiter) : false
        if (config.allowOrigin) PICO_HEADERS['Access-Control-Allow-Origin'] = config.allowOrigin

        console.log('web server hash check[',secretKey ? 'enabled' : 'disabled',']')
        console.log('web server cull age +- milliseconds [',cullAge ? cullAge : 'disabled',']')
        console.log('web server delimiter [',delimiter,']')
        console.log('web server allow origin [',PICO_HEADERS['Access-Control-Allow-Origin'],']')
        console.log('web server listening to', (pfx ? 'https' : 'http'), config.port)

        next(null, web)

        update()
    })
}
