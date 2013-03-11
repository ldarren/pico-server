//process.on('uncaughtException', function(err){
//    console.error('[uncaught exception', err);
//});

require('../common/const');

var
path = require('path'),
loadConfig = require('./lib/utils').loadConfig,
args = process.argv,
env = process.env,
root,
i=1,
l=args.length;

// find root path
for(; i<l; i++){ if (args[i].charAt(1) !== '-') break; }

root = path.dirname(args[i]);
console.log('root:',root);
for(; i<l; i++){
    switch(args[i]){
        case '-h':
            console.log('usage help here');
            break;
        case '-c':
            var
            c = root + '/' + args[++i],
            p = path.dirname(c);
            loadConfig(root, require(p+'/base'), require(c));
            break;
    }
}
