// TODO:
// 1) make view and data job - data
// 2) add modelId info to view - data
// 3) better error handling. e.g. error code, better error object, better description
// 4) remove session and logging from web?
const
JOB_API = 0,
JOB_OBJ = 1,
JOB_FUNC = 2,
JOB_RENDER = 3,
JOB_MODEL_INFOS = 4,
JOB_MODELS = 5,
PICO_CHANNEL_ID = G_CCONST.CHANNEL_ID,
PICO_CHANNEL_PASS = G_CCONST.CHANNEL_PASS,
PICO_HEADERS = {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Object.freeze(G_PICO_WEB = {
    RENDER_NO: 0,
    RENDER_FULL: 1,
    RENDER_HEADER: 2
});

var
http = require('http'),
https = require('https'),
url = require('url'),
fs = require('fs'),
path = require('path'),
querystring = require('querystring'),
crypto = require('crypto'),
processGroups = {ack:[removeAck]},
connMap = {},
config  = {},
channelStorage = null,
secretKey = null, cullAge = 0,delimiter = false,
web = {
    route: function(api, funcs){
        if (processGroups[api]){
            console.error('route api['+api+'] already taken');
            return;
        }
        processGroups[api] = funcs;
    },
    setChannelStorage: function(storage){
        channelStorage = storage;
        console.log('web server channel support [',channelStorage ? 'enabled' : 'disabled',']');
    },
    retainChannel: function(req, res){
        // TODO use response.setTimeout(msecs, callback) instead of manual tracking timeout
        if (!channelStorage) return false;
        var channelId = res.getHeader(PICO_CHANNEL_ID);
        if (!res || !res.writable || !channelId) return false;
        var conn = {req:req, res:res};
        connMap[channelId] = conn;
        res.setTimeout(1000*60*5, dc); 
        return true;
    },
},
onConnect = function(req, res){
    var
    clientInfo = url.parse(req.url, true),
    data = '';

    req.on('data', function(chunk){ data += chunk; });
    req.on('end', function(){
        switch(req.method.toLowerCase()){
            case 'head':
            case 'options':
                res.writeHead(200, PICO_HEADERS);
                return res.end();
            case 'post':
            case 'put':
                var orders;
                try{
                    var json = JSON.parse(data);
                    if (json.orders) orders = json.orders; // some situation parent array is invalid
                    else orders = json;
                }catch(exp){
                    console.error('json parsing exception', exp, '[',data,']');
                    res.error = 400;
                    res.setTimeout(10000, dc);
                }finally{
                    data = undefined;
                    if (!orders) return;
                }
                break;
            default:
                return res.end();
        }

        auth(orders, 0, function(err, order){
            if (err){
                console.error(res.connection.remoteAddress, err);
                // delay error to prevent ddos
                res.error = 403;
                res.setTimeout(5000, dc);
                return;
            }

            getChannelId(req, clientInfo.pathname, function(err, channelId, channelPass){

                if (channelId) {
                    res.setHeader(PICO_CHANNEL_ID, channelId);
                    res.setHeader(PICO_CHANNEL_PASS, channelPass);
                }
                createSession(req, res, channelId, function(err, session){
session.log(res.connection.remoteAddress, channelId, req.headers, json);
                    factory(session, orders, 0, function(err, order){
                        if (err) {
                            session.error(err);
                            showErr(session, err, order, res);
                            return res.end();
                        }
                        showMsgs(session, channelId, function(err){
                            res.end();
                        });
                    });
                });
            });
        });
    });
},
getChannelId = function(req, path, cb){
    if (!channelStorage) return cb();

    var
    channelId = req.headers[PICO_CHANNEL_ID],
    channelPass = req.headers[PICO_CHANNEL_PASS];

    if (channelId) {
        channelStorage.renewChannelId(channelId, channelPass, function(err, channelId, channelPass){
            if (err) return channelStorage.newChannelId(cb);
            cb(null, channelId, channelPass);
        });
        return;
    }
    if ('/channel' === path){
        return channelStorage.newChannelId(cb);
    }
    cb();
}
createSession = function(req, res, channelId, cb){
    if (channelId && channelStorage){
        channelStorage.retrieveMsgIds(channelId, function(err, acks){
            cb(err, new Session(req, res, acks));
        });
    }else{
        cb(null, new Session(req, res, null));
    }
},
Session = function(req, res, acks){
    this[G_CCONST.SESSION_REQ] = req;
    this[G_CCONST.SESSION_RES] = res;
    this[G_CCONST.SESSION_ACKS] = acks;
    this[G_CCONST.SESSION_JOBS] = [];
},
// modelInfos = [[{modelId:userData,key:3},{modelId:mapData,key:ab1}],[{modelId:userData,key:5},{modelId:mapData,key:bb3}]]
// params = [[userData:3, mapData:ab1],[userData:5, mapData:bb3]]
deref = function(session, modelInfos){
    var params = [];

    if (!modelInfos || !modelInfos.length) return params;

    var modelInfo,info,value,model,j,k;

    for(var i=0, l=modelInfos.length; i<l; i++){
        modelInfo = modelInfos[i];
        value = [];
        for(j=0, k=modelInfo.length; j<k; j++){
            info = modelInfo[j];
            model = session.getModel(info.modelId);
            if (!model) continue;
            value.push(model[info.key])
        }
        params.push(value);
    }
    return params;
},
dbExec = function(obj, func, modelss, index, cb){
    if (!modelss || !modelss.length || modelss.length === index) return cb();

    var models = modelss[index];
    func.call(obj, models, function(err, newModels){
        if (err) {
            console.error(err);
            return cb(G_CERROR['500']);
        }
        modelss[index] = newModels; // always insert into first model
        dbExec(obj, func, modelss, ++index, cb);
    });
},
dbUpdate = function(session, index, jobs, cb){
    if (index >= jobs.length) return cb();

    var
    job = jobs[index],
    obj = job[JOB_OBJ],
    func = job[JOB_FUNC];

    if (!func) return dbUpdate(session, ++index, jobs, cb);

    var
    modelInfos = job[JOB_MODEL_INFOS],
    models = deref(session, modelInfos);

    job[JOB_MODELS] = models;

    dbExec(obj, func, models, 0, function(err){
        if (err) return cb(err);
        dbUpdate(session, ++index, jobs, cb);
    });
},
commitSession = function(session, order, cb){
    dbUpdate(session, 0, session[G_CCONST.SESSION_JOBS], function(err){
        cb(err);
    });
},
pipeline = function(session, processList, processIdx, order, cb){
    if (!processList || processIdx >= processList.length) return cb(null, session);
    var process = processList[processIdx];
    process(session, order, function(err){
        if (err) {
            console.error(err);
            return cb(G_CERROR['500'], session);
        }
        pipeline(session, processList, ++processIdx, order, cb);
    });
},
auth = function(orders, orderIdx, cb){
    if (orders.length <= orderIdx) return cb();

    var order = orders[orderIdx++];
    if (!order) return auth(orders, orderIdx, cb);

    var
    t = order.date,
    dt = Date.now() - t;

    if (cullAge && (!t || dt > cullAge || dt < -cullAge)){
        return cb('timed error request: api['+order.api+']t['+t+']dt['+dt+']', order);
    }

    if (secretKey){
        var
        key = crypto.createHmac('md5', secretKey+t).update(order.data).digest('base64');

        if (key !== order.key){
            return cb('key error request: api['+order.api+']t['+t+']key['+key+']', order);
        }
    }
    try{
        order.data = JSON.parse(order.data);
    }catch(exp){
        return cb(exp, order);
    }
    auth(orders, orderIdx, cb);
},
factory = function(session, orders, orderIdx, cb){
    if (!orders || !orders.length || orderIdx >= orders.length) return cb();
    var order = orders[orderIdx++];
    if (!order || !order.api) return factory(session, orders, orderIdx, cb);

    var processGroup = processGroups[order.api];
    if (!processGroup) return cb(G_CERROR['404']);

    pipeline(session, processGroup, 0, order, function(err){
        if (err) return cb(err, order);
        commitSession(session, order, function(err){
            if (err) return cb(err, order);
            showView(session, order, function(){
                factory(session, orders, orderIdx, cb);
            });
        });
    });
},
renderView = function(session, jobs, res, channelId, reqId, cb){
    if (!jobs.length) return cb();
    var job = jobs.shift();
    if (!job) return renderView(session, jobs, res, channelId, reqId, cb);

    var 
    modelInfos = job[JOB_MODEL_INFOS],
    renderMode = job[JOB_RENDER];
    if (!renderMode || !modelInfos || !modelInfos.length || !modelInfos[0].length) return renderView(session, jobs, res, channelId, reqId, cb);

    var
    api = job[JOB_API],
    view = {
        api: api,
        reqId: reqId,
        resId: 0,
        data: {}
    },
    modelss = job[JOB_MODELS] || deref(session, modelInfos), // read job has no JOB_MODELS
    data = view.data;

    if (G_PICO_WEB.RENDER_FULL === renderMode){ // 1: render full, 2: render header only
        var model, modelInfo;
        for (var i=0, l=modelss.length; i<l; i++){
            model = modelss[i][0];
            modelInfo = modelInfos[i][0];
            data[modelInfo.key] = model;
        }
    }
    res.writeHeader(200, PICO_HEADERS);
    if (channelId && channelStorage){
        channelStorage.newMessageId(channelId, function(err, resId){
            if (err) console.error(err); // must send even if error occured
            view.resId = resId;
            var packet = JSON.stringify(view);
session.log(res.connection.remoteAddress, channelId, view);
            channelStorage.storeMessage(channelId, resId, packet, function(err){
                if (err) console.error(err); // must send even if error occured
                res.write(packet);
                if (delimiter) res.write(delimiter);
                return renderView(session, jobs, res, channelId, reqId, cb);
            });
        });
        return;
    }
session.log(res.connection.remoteAddress, 'no channel', view);
    res.write(JSON.stringify(view));
    if (delimiter) res.write(delimiter);
    return renderView(session, jobs, res, channelId, reqId, cb);
},
showErr = function(session, err, order, res){
    // TODO: better error handling
    order = order || {};
    var view = {
        api: order.api || '',
        reqId: order.reqId,
        resId: 0,
        error:err
        };
if(session)session.log(res.connection.remoteAddress, res.getHeader(PICO_CHANNEL_ID), view);
    res.writeHeader(err.code, PICO_HEADERS);
    res.write(JSON.stringify(view));
    if (delimiter) res.write(delimiter);
},
showView = function(session, order, cb){
    var
    res = session[G_CCONST.SESSION_RES],
    channelId = res.getHeader(PICO_CHANNEL_ID);
    jobs = session[G_CCONST.SESSION_JOBS];

    if (!res || !jobs) return cb(G_CERROR['400']);

    renderView(session, jobs, res, channelId, order.reqId, cb);
},
showMsgs = function(session, channelId, cb){
    var acks = session[G_CCONST.SESSION_ACKS];
    if (!channelStorage || !channelId || !acks || !acks.length) return cb();

    channelStorage.retrieveMessages(channelId, acks, function(err, msgList){
        if (err) return cb(err);
        var
        res = session[G_CCONST.SESSION_RES],
        msg;
        for(var i=0,l=msgList.length; i<l; i++){
            msg = msgList[i];
            if (msg){
                res.write(msg);
                if (delimiter) res.write(delimiter);
            }
        }
        cb();
    });
},

updateChannel = function(channelIds, cb){
/*    if (!channelIds || !channelIds.length) return cb();
    var
    channelId = channelIds.pop(),
    conn = connMap[channelId];
    if (!conn) updateChannel(channelIds, cb);

    channelStorage.getMessages(channelId, function(err, orders){
        if (err) updateChannel(channelIds, cb);
        factory(conn.req, conn.res, orders, 0, function(err, order){
            process.nextTick(function()(updateChannel(channelIds, cb);));
        });
    });*/
},
update = function(){
/*
    if (!channelStorage) return;
    // check for redis update
    var allchannels = Object.keys(connMap);
    channelStorage.getAllRecipients(allChannels, function(err, channelIds){

        updateChannel(channelIds, function(){
            process.nextTick(update);
        });
    });*/
},
dc = function(){
    if (this.error){
        return showErr(null, G_CERROR[this.error], null, this);
    }
    if (!channelStorage) return;
    var channelId = this.getHeader(PICO_CHANNEL_ID);
    if (!channelId) return;
    console.log('dc channelId', channelId);
    delete connMap[channelId];
};
function removeAck(session, order, next){
    if (!channelStorage) return next();
    var
    channelId = session[G_CCONST.SESSION_RES].getHeader(PICO_CHANNEL_ID),
    resId = order.data.resId;
    channelStorage.removeMessage(channelId, resId, function(err, removedCount){
        if (removedCount){
            var
            arr = session[G_CCONST.SESSION_ACKS],
            i = arr.indexOf(resId);
            arr.splice(i, 1);
        }
        next(err);
    });
}


function pinPointCaller(_, stack){
    var r = stack[0];
    return '['+(r.getFunctionName() || r.getTypeName()+'.'+r.getMethodName()) +'@'+r.getFileName() + ':' + r.getLineNumber() + ':' + r.getColumnNumber()+']';
}
Session.prototype.log = function(){
    var
    originPrepare = Error.prepareStackTrace,
    originCount = Error.stackTraceLimit;

    Error.prepareStackTrace = pinPointCaller;
    Error.stackTraceLimit = 1;

    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var params = [(new Date).toISOString(), err.stack];
    console.log.apply(console, params.concat(Array.prototype.slice.call(arguments)));

    Error.prepareStackTrace = originPrepare;
    Error.stackTraceLimit = originCount;
};
Session.prototype.error = function(){
    var originCount = Error.stackTraceLimit;

    Error.stackTraceLimit = 4;

    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var params = [(new Date).toISOString()];
    params = params.concat(Array.prototype.slice.call(arguments));
    params.push('\n');
    console.error.apply(console, params.concat(err.stack));

    Error.stackTraceLimit = originCount;
};
Session.prototype.getModel = function(modelId){
    if (G_CCONST.SESSION_REQ === modelId || G_CCONST.SESSION_RES === modelId || G_CCONST.SESSION_JOBS === modelId || G_CCONST.SESSION_ACKS === modelId)
        return console.error('Session.getModel("'+modelId+'") collide with keyword: '+modelId)
    return this[modelId] = this[modelId] || {};
};
// main model must be set at modelInfos[0][0], modelInfos = [[{modelId:MID, key:xxx},{modelId:MID, key:xxx}],[{modelId:MID, key:xxx}]]
// render = 0:no render, 1: full render, 2: header only
Session.prototype.addJob = function(api, obj, func, render, modelInfos){
    var i,l,j,k,mis,mi;
    for(i=0,l=modelInfos.length;i<l;i++){
        mis = modelInfos[i];
        for(j=0,k=mis.length; j<k; j++){
            mi = mis[j];
            if (!mi || !mi.modelId || !mi.key) return this.error('Exception! @api:', api, 'modelId or key not found in', mi);
        }
    }
    this[G_CCONST.SESSION_JOBS].push(Array.prototype.slice.call(arguments));
};

Session.prototype.createModelInfo = function(modelId, key){
    if (!this[modelId] || !this[modelId][key]) return this.error('Exception!', modelId, 'and', key, 'Cant be found in session');
    return {modelId:modelId, key:key};
};
exports.init = function(appConfig, libConfig, next){
    var
    path1 = libConfig.pfxPath,
    path2 = appConfig.path + path.sep + path1,
    isPath1 = fs.existsSync(path1),
    isPath2 = path1 ? fs.existsSync(path2) : false, 
    pfx = (isPath1 ? path1 : (isPath2 ? path2 : null)),
    server = pfx ? https.createServer({pfx: fs.readFileSync(pfx)}, onConnect) : http.createServer(onConnect);

    server.listen(libConfig.port, function(){
        config = libConfig;
        secretKey = config.secretKey || null;
        cullAge = config.cullAge;
        delimiter = config.delimiter ? JSON.stringify(config.delimiter) : false;

        console.log('web server hash check[',secretKey ? 'enabled' : 'disabled',']');
        console.log('web server cull age +- milliseconds [',cullAge ? cullAge : 'disabled',']');
        console.log('web server delimiter [',delimiter,']');
        console.log('web server listening to', (pfx ? 'https' : 'http'), libConfig.port);

        next(null, web);

        update();
    });
};
