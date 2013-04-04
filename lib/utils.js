var
path = require('path'),
mergeObj = require('pico-common/objTools').mergeObj,
loadLibs = function(keys, context, cb){
    if (!keys.length) { return cb(null, context); }

    var
    config = context.config, app = config.app, lib = config.lib,
    key = keys.shift(),
    value = lib[key],
    module = require('./'+value.mod);
    
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
    elements = require(context.root+path.sep+elementPath);
    if (!elements){
        config.error('failed to load', elementPath);
        return loadElements(elementPaths, context, cb);
    }
    loadElement(elements, context, function(){
        return loadElements(elementPaths, context, cb);
    });
};

exports.loadConfig = function(rootPath, baseConfig, envConfig, cb){
    var config = mergeObj(require(baseConfig), require(envConfig));
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
