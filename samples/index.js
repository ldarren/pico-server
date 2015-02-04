var
pico = require('../index'),
fs   = require('fs'),
path = require('path'),
args = process.argv,
root = args[1],
configPath

fs.lstat(root, function(err, stats){
    if (err) return console.error(err)
    if (stats.isFile()) root = path.dirname(root)

    for(var i=2,l=args.length; i<l; i++){
        switch(args[i]){
            case '-h':
            console.log('usage help:')
            console.log('node {PATH} -c {CONFIG_FILE_PATH}')
            break
            case '-c':
            configPath = args[++i]
            break
        }
    }
    pico.createApp(root, configPath)
})
