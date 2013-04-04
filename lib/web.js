// TODO:
// 1) make view and data job - data
// 2) add modelId info to view - data
// 3) better error handling. e.g. error code, better error object, better description
const
JOB_METHOD = 0,
JOB_API = 1,
JOB_REQ_ID = 2,
JOB_OBJ = 3,
JOB_FUNC = 4,
JOB_RENDER = 5,
JOB_MODEL_INFOS = 6,
JOB_INSERT_ID = 7,
JOB_MODELS = 8;

var
http = require('http'),
url = require('url'),
querystring = require('querystring'),
//redisMailbox = require('../app/models/mailbox'), // TODO another module?
processGroups = {},
connMap = {},
connArr = [],
config  = {},
web = {
    route: function(api, funcs){
        processGroups[api] = funcs;
    }
},
onConnect = function(req, res){
    var
    clientInfo = url.parse(req.url, true),
    data = '';

    req.on('data', function(chunk){ data += chunk; });
    req.on('end', function(){
        var orders = [];
console.log('data:', data);
        if (data){
            try{
                var json = JSON.parse(data);
            }catch(exp){
                console.error('json parsing excep', exp, data);
            }finally{
                if (json && json.orders) orders = json.orders; // some situation parent array is invalid
                else orders = json;
            }
        }

        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
        });

console.log('orders:', orders);
        var session = new Session(req, res);
        factory(session, orders, 0, function(err, order){
            if (err) {
                session.log(err);
                showErr(err, order, res);
            }
            switch(clientInfo.pathname){
                case 'pull':
                    if (!register(req, res)){
                        res.end(); // TODO: return error code?
                    }
                    res.on('close', dc); 
                    break;
                default:
console.log('call end');
                    res.end();
                    break;
            }
        });
    });
},
Session = function(req, res){
    this.req = req;
    this.res = res;
    this.jobs = [];
},
// modelInfos = [[{modelId:userData,key:3},{modelId:mapData,key:ab1}],[{modelId:userData,key:5},{modelId:mapData,key:bb3}]]
// params = [[userData:3, mapData:ab1],[userData:5, mapData:bb3]]
deref = function(session, modelInfos){
    session.log('deref', modelInfos);
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
dbExec = function(obj, func, modelss, index, insertId, cb){
    console.log('dbExec', index, modelss);
    if (!modelss || !modelss.length || modelss.length === index) return cb();
    var models = modelss[index];
    func.call(obj, models, function(err, info){
        if (err) return cb(err);
        if (insertId) models[0][insertId] = info.insertId; // always insert into first model
        dbExec(obj, func, modelss, ++index, insertId, cb);
    });
},
dbUpdate = function(session, index, jobs, cb){
    if (index >= jobs.length) return cb();

    var
    job = jobs[index],
    method = job[JOB_METHOD];
    session.log('dbUpdate', job, job[JOB_MODEL_INFOS], JOB_MODEL_INFOS);

    if (G_CCONST.READ === method) return dbUpdate(session, ++index, jobs, cb);

    var
    obj = job[JOB_OBJ],
    func = job[JOB_FUNC],
    modelInfos = job[JOB_MODEL_INFOS],
    insertId = job[JOB_INSERT_ID],
    models = deref(session, modelInfos);

    job.push(models);

    dbExec(obj, func, models, 0, insertId, function(err){
        if (err) return cb(err);
        dbUpdate(session, ++index, jobs, cb);
    });
},
commitSession = function(session, order, cb){
    dbUpdate(session, 0, session.jobs, function(err){
        cb(err);
    });
},
pipeline = function(session, processList, processIdx, order, cb){
    if (!processList || processIdx >= processList.length) return cb(null, session);
    var process = processList[processIdx];
    process(session, order, function(err){
        if (err) return cb(err, session);
        pipeline(session, processList, ++processIdx, order, cb);
    });
},
factory = function(session, orders, orderIdx, cb){
    if (!orders || !orders.length || orderIdx >= orders.length) return cb();
    var order = orders[orderIdx];
    if (!order || !order.api) factory(session, orders, ++orderIdx, cb);
    var processGroup = processGroups[order.api];
    if (!processGroup) factory(session, orders, ++orderIdx, cb);

    pipeline(session, processGroup, 0, order, function(err){
        if (err) return cb(err, order);
        commitSession(session, order, function(err){
            if (err) return cb(err, order);
            showView(session, function(){
                factory(session, orders, ++orderIdx, cb);
            });
        });
    });
},
renderView = function(session, job){

session.log('job renderView:', job);
    if (!job || !job[JOB_RENDER]) return;

    var
    view = {},
    api = job[JOB_API],
    reqId = job[JOB_REQ_ID],
    modelInfos = job[JOB_MODEL_INFOS],
    modelss = job[JOB_MODELS] || deref(session, modelInfos), // read job has no JOB_MODELS
    data = {};

    view.api = api;
    view.modelId = modelInfos[0][0].modelId;
    view.reqId = reqId; // TODO: client and server packet id
    view.resId = 0;
    var model, modelInfo;
    for (var i=0, l=modelss.length; i<l; i++){
        model = modelss[i][0];
        modelInfo = modelInfos[i][0];
        data[modelInfo.key] = model;
    }
    view.data = data;
    return view;
},
showErr = function(err, order, res, cb){
    // TODO: better error handling
    order = order || {};
    res.write(JSON.stringify({
        api: order.api,
        reqId: order.reqId,
        resId: 0,
        error:JSON.stringify(err)
    }));
},
showView = function(session, cb){
    var
    res = session.res,
    jobs = session.jobs,
    view;
session.log('showView', jobs);
    for (var i=0, l=jobs.length; i<l; i++){
        view = renderView(session, jobs.shift());
        if (!view) continue;
        res.write(JSON.stringify(view));
    }
    return cb();
},
register = function(req, res){
    var auth = orders[G_API.AUTH];
    if (!res || !res.writable || !auth || !auth.id) return false;
    res.uid = auth.id;
    var conn = {req:req, res:res, ttl: Date.now() + (1000 * 60 * 5)};
    connMap[res.uid] = conn;
    connArr.push(conn);
    return true;
},
updateUser = function(userIds, cb){
/*    if (!userIds || !userIds.length) return cb();
    var
    userId = userIds.pop(),
    conn = connMap[userId];
    if (!userId || !conn) updateUser(userIds, cb);

    redisMailbox.getMessages(userId, function(err, orders){
        if (err) updateUser(userIds, cb);
        factory(conn.req, conn.res, orders, 0, function(err, order){
            updateUser(userIds, cb);
        });
    });*/
},
update = function(){
/*
    // check for expired connections
    var
    start = Date.now(),
    conn,
    res,
    isActive = conn && conn.res && conn.res.writable;

    while (connArr.length){
        conn = connArr[0];
        res = conn.res;
        if (!isActive || conn.ttl < start) {
            if (isActive) res.end({api:'renew'});
            connArr.shift();
            delete connMap[res.uid];
        }else{
            break; // everything is fine
        }
    }

    // check for redis update
    redisMailbox.getAllRecipients(function(err, userIds){

        updateUser(userIds, function(){
            var nextUpdate = config.updateRate - (Date.now() - start);
            if (nextUpdate < 0) nextUpdate = 300;
            setTimeout(update, nextUpdate);
        });
    });*/
},
dc = function(){
    var uid = this.uid;
    if (!uid) return;
    console.log('dc uid', uid);
    delete connMap[uid]; // don't need to remove conn in connArr, clean up in update()
};

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
    console.log.call(console, arguments);
};
Session.prototype.getModel = function(modelId){
    return this[modelId] = this[modelId] || {};
};
// main model must be set at modelIds[0]
Session.prototype.addJob = function(method, api, reqId, obj, func, render, models, insertId){
    this.jobs.push(Array.prototype.slice.call(arguments));
};

exports.init = function(appConfig, libConfig, next){

    var server = http.createServer(onConnect);

    setTimeout(update, libConfig.updateRate);

    server.listen(libConfig.port, function(){
        console.log('listening to ', libConfig.port);
        config = libConfig;
        next(null, web);
    });

};