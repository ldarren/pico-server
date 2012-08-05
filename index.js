/*
 * main module. read config, init module
 */
const
PATH_DRIVERS = '/lib/drivers/',
PATH_ACTIONS_DEFAULT = '/actions',
PATH_MODELS_DEFAULT = '/models';

var
path = require('path'),
util = require('util'),
cluster = require('cluster'),
Errors = require('./lib/errors/'),
Models = require('./lib/models/');

function _loadModules(context, app, config, keys, cb){
  if (0 == keys.length) { cb(null, context); return; }
  var key = keys.pop(), val = config[key];
  require(__dirname+PATH_DRIVERS+val.mod).init(app, val,function(err, module){
    context[key] = module;
    _loadModules(context, app, config, keys, cb);
  });
}

function _loadElements(context, elements, cb){
  if (0 == elements.length) { cb(null, null); return; }
  var element = elements.pop();
  element.setup(context,function(){
    _loadElements(context, elements, cb);
  });
}

exports.createContext = function (args, cb){
  if (cluster.isMaster){
    for(var i=0,j=require('os').cpus().length;i<j;++i){
      cluster.fork();
    }
    cluster.on('death', function(worker) {
      console.log('worker %d died. restarting...', worker.pid);
      cluster.fork();
    });
  }else{
    var 
    config, error,
    context = {homeDir:path.dirname(args[1])+'/'};

    process.on('uncaughtException', function(err){
      console.log('PICO Uncaught Exception:\n %s', err.stack);
    });

    for(var i=0, j=args.length; i<j; ++i){
      switch(args[i]){
        case '-h':
        {
          console.log('usage: %s %s -c CONFIG_FILE', args[0], args[1]);
          //process.exit(0);
          break;
        }
        case '-c':
        {
          var cfgFile = args[++i];

          config = require(context.homeDir+cfgFile);
          _loadModules(context, config.app, config.lib, Object.keys(config.lib), function(err, context){
            error = err;
            context.config = config;
            return cb(error, context);
          });
          break;
        }
      }
    }
    if (null == config){
      error = 'usage: node index.js -c CONFIG_FILE';
      return cb(error, context);
    }
  }
}

exports.setup = function(context, cb){
  var
  root = context.homeDir,
  appCfg = context.config.app,
  actions = appCfg.actionPath || PATH_ACTIONS_DEFAULT,
  models = appCfg.modelPath || PATH_MODELS_DEFAULT;

  _loadElements(context, require(root+models), function(err, elements){
    if (err) return cb(err);
    _loadElements(context, require(root+actions), cb);
  });
}

// exports classes
exports.Errors = Errors;
exports.Models = Models;
