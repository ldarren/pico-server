process.on('uncaughtException', function(err){
    console.error('[uncaught exception', err);
});

require('./lib/const');

var
cluster = require('cluster'),
loadConfig = require('./lib/utils').loadConfig;

exports.createApp = function(rootPath, configBasePath, configPath){
    var env = process.env;

    if (env.picoConfigBasePath) configBasePath = env.picoConfigBasePath;
    if (env.picoConfigPath) configPath = env.picoConfigPath;

    loadConfig(rootPath, configBasePath, configPath, function(err, config){
        if (err) return console.error(err);

        if (cluster.isMaster){
            if (!config.worker) return console.error('no worker config found');
            var workerCfg = config.worker;

            cluster.setupMaster({
                exec: rootPath
            });

            for(var i=0,l=workerCfg.count || require('os').cpus().length; i<l; i++){
                cluster.fork({
                    picoConfigBasePath: workerCfg.cfgBase,
                    picoConfigPath:workerCfg.cfg
                });
            }
        }
    });
});
