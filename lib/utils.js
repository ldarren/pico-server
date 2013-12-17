var
cluster = require('cluster'),
path = require('path'),
zlib = require('zlib'),
http = require('http'),
https = require('https'),
url = require('url'),
qs = require('querystring'),
mergeObj = require('pico-common').mergeObj,
loadLibs = function(keys, context, cb){
    if (!keys.length) { return cb(null, context); }

    var
    config = context.config, app = config.app, lib = config.lib,
    key = keys.shift(),
    value = lib[key],
    p = path.dirname(value.mod),
    module = require('.' === p ? p + path.sep + value.mod : path.resolve(app.path, value.mod));
    
    module.init(app, value, function(err, mod){
        if (err) console.error('failed to load lib', value.mod, err);
        context[key] = mod;
        loadLibs(keys, context, cb);
    });
},
loadElement = function(elements, context, cb){
    if (!elements.length) { return cb(); }
    var element = elements.shift();

    element.setup(context, function(err){
        if (err) console.error('failed to load element', err);
        loadElement(elements, context, cb);
    }); 
},
loadElements = function(elementPaths, context, cb){
    if (!elementPaths.length) { return cb(null, context); }
    var
    elementPath = elementPaths.shift(),
    elements;
    
    try{
        elements = require(context.config.app.path+path.sep+elementPath);
    }catch(ex){
        console.error('failed to load elements', elementPath, ', exception:',ex.message);
        return loadElements(elementPaths, context, cb);
    }

    loadElement(elements, context, function(){
        return loadElements(elementPaths, context, cb);
    });
},
loadConfig = function(rootPath, configPath, cb){
    var config = require(configPath);

    if (config.require){
        var
        r = config.require,
        p = path.dirname(configPath) + path.sep,
        opt = {mergeArr: true};
        for(var i=0,l=r.length; i<l; i++){
            config = mergeObj(require(p+r[i]), config, opt); 
        }
    }
    if (!config || !config.app || !config.app.elements) {
        return cb('not enough sections in config, config must contain app and elements sections');
    }
    if (config.app.path) {
        console.warn('config app.path is replaced by', rootPath);
    }
    config.app.path = rootPath;
    loadLibs(Object.keys(config.lib), {config: config}, function(err, context){
        loadElements(config.app.elements, context, function(){
            return cb(null, config);
        });
    });
};

// to prevent ssl error. see http://stackoverflow.com/questions/11091974/ssl-error-in-nodejs
https.globalAgent.options.secureProtocol = 'SSLv3_method';

module.exports = {
    createApp: function(rootPath, configPath){
        var env = process.env;

        if (env.picoConfigPath) configPath = env.picoConfigPath;

        console.log('createApp',rootPath,configPath);

        loadConfig(rootPath, rootPath + path.sep + configPath, function(err, config){
            if (err) return console.error(err);

            if ('live' === config.app.env){
                // this might supress bug alert
                process.on('uncaughtException', function(err){
                    console.error('[uncaught exception', err);
                });
            }


            if (cluster.isMaster){
                if (!config.worker) return console.error('no worker config found');
                var workerCfg = config.worker;

                cluster.setupMaster({
                    exec: rootPath
                });

                for(var i=0,l=workerCfg.count || require('os').cpus().length; i<l; i++){
                    cluster.fork({
                        picoConfigPath: workerCfg.config
                    });
                }
            }
        });
    },

    zip: function(str, cb){
        if ('string' !== typeof(str)) return cb('zip err: no payload: '+typeof(str));
        zlib.deflateRaw(str, function(err, buf){
            cb(err, err || buf.toString('base64'));
        });
    },

    unzip: function(str, cb){
        if ('string' !== typeof(str) || '' === str) return cb('unzip err: no payload: '+typeof(str));
        zlib.inflateRaw(new Buffer(str, 'base64'), function(err, buf){
            cb(err, err || buf.toString());
        });
    },
    // params can be an object or an array of objects
    // if it is an array, objects will be merged, overlapped key will be overrided by later object
    ajax: function(method, href, params, headers, cb, userData){
        cb = cb || function(err){if (err) console.error(method, href, params, headers, userData, err);};

        var
        options = url.parse(href),
        isGet = 'GET' === (options.method = method.toUpperCase()),
        protocol = 'http:' === options.protocol ? http : https,
        body = '';

        if ('object' === typeof params){
            if (undefined === params.length){
                body = qs.stringify(params);
            }else{
                var
                merged = {},
                opt = {tidy:1, mergeArr:1};
                for(var i=0,l=params.length; i<l; i++){
                    merged = mergeObj(merged, params[i], opt);
                }
                body = qs.stringify(merged);
            }
        }

        if (isGet){
            options.path += body ? '?' + body : body;
            if (headers) options.headers = headers;
        }else{
            options.headers = mergeObj(headers || {}, {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': body ? body.length : 0
            });
        }

        var req = protocol.request(options, function(res){
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function(chunk){
                data += chunk;
            });
            res.on('end', function(){
                cb(null, res, data, userData);
            });
        });

        req.on('error', function(err){
            cb(err, null, null, userData);
        });

        if (!isGet){
            req.write(body);
        }
        req.end();  
    },

    mergeObj: mergeObj,

    apiList: [
        'createApp',
        'zip',
        'unzip',
        'ajax',
        'mergeObj'
    ]
};
