var pico = require('../../index');


var
path = require('path'),
args = process.argv,
root = args[1],
configPath;

if ('.js' === path.extname(root)) root = path.dirname(root);

for(var i=2,l=args.length; i<l; i++){
    switch(args[i]){
        case '-h':
        console.log('usage help here');
        break;
        case '-c':
        configPath = args[++i];
        break;
    }
}
pico.createApp(root, configPath);
