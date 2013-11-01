var
cluster = require('cluster'),
path = require('path'),
zlib = require('zlib'),
mergeObj = require('pico-common').mergeObj,
loadLibs = function(keys, context, cb){
    if (!keys.length) { return cb(null, context); }

    var
    config = context.config, app = config.app, lib = config.lib,
    key = keys.shift(),
    value = lib[key],
    module = require('.' + path.sep + value.mod);
    
    module.init(app, value, function(err, mod){
        if (err) console.error('failed to load', value.mod, err);
        context[key] = mod;
        loadLibs(keys, context, cb);
    });
},
loadElement = function(elements, context, cb){
    if (!elements.length) { return cb(); }
    var element = elements.shift();

    element.setup(context, function(err){
        if (err) console.error('failed to element', err);
        loadElement(elements, context, cb);
    }); 
},
loadElements = function(elementPaths, context, cb){
    if (!elementPaths.length) { return cb(null, context); }
    var
    elementPath = elementPaths.shift(),
    elements;
    
    try{
        elements = require(context.root+path.sep+elementPath);
    }catch(ex){
        console.error('failed to load:', elementPath, ', exception:',ex.message);
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
        p = path.dirname(configPath) + path.sep;
        for(var i=0,l=r.length; i<l; i++){
            config = mergeObj(require(p+r[i]), config); 
        }
    }
    // root and config are reserved words in config object
    if (!config || !config.app || !config.lib || !config.app.elements) {
        return cb('not enough sections in config, config must contain app, lib and elements sections');
    }
    if (config.root || config.config) {
        return cb('config contain root or/and config reserved word sections');
    }
    loadLibs(Object.keys(config.lib), {root: rootPath, config: config}, function(err, context){
        loadElements(config.app.elements, context, function(){
            return cb(null, config);
        });
    });
};

exports.createApp = function(rootPath, configPath){
    var env = process.env;

    if (env.picoConfigPath) configPath = env.picoConfigPath;
console.log(rootPath,configPath);
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
};

exports.zip = function(obj, cb){
    if ('object' !== typeof(obj)) return cb('zip err: no payload');
    zlib.deflate(JSON.stringify(obj), function(err, buffer){
        cb(err, err || buffer.toString('base64'));
    });
};

exports.unzip = function(buffer, cb){
    if ('string' !== typeof(buffer) || '' === buffer) return cb('zip err: no payload');
    zlib.inflate(new Buffer(buffer, 'base64'), function(err, str){
        cb(err, str ? JSON.parse(str) : null);
    });
};

exports.apiList = [
    'createApp',
    'zip',
    'unzip'
];
