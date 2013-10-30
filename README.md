pico-server
===========

A lean and mean realtime http/https server

Features
========
* two channel design, push and pull channel to achieve fast and realtime http server
* data cache to prevent data lost (WIP)
* efficent user session handling, session only persistence when pull channel dc
* supported bath requests 
* server stream data to client through push channel

Installation
============
1. mkdir [PROJ_DIR]
2. cd [PROJ_DIR]
3. sudo npm install pico-server -g
4. npm link pico-server
5. mkdir app # all your server code should goes here

Create a Hello World Server
===========================
1. mkdir -p app/config app/actions # create minimal project folders
2. touch app/config/master.json app/config/worker.json
3. paste this to your master.json
```
{
    "app":{
        "name": "YOUR_PROJECT_NAME",
        "env": "dev",
        "elements": []
    },
    "worker":{
        "config": "config/worker",
        "count":1
    },
    "lib":{
    }
}
```

4. paste this to your worker.json
```
{
    "app":{
        "name": "YOUR_PROJECT_NAME",
        "env": "dev",
        "elements": ["actions"]
    },
    "lib":{
        "webServer":{
            "mod":"web",
            "port":5678,
            "updateRate":60000
        }
    }
}
```

5. vi app/index.js # create server entry point
```
var pico = require('pico-server');
// pico.createApp('/var/nodes/YOUR_PROJ_DIR/app', 'config/master');
pico.createApp('PATH/TO/APP/', 'CONFIG/PATH');
```

6. vi app/actions/index.js
```
module.exports = [
    require('./foobar'),
];
```

7. vi app/actions/foobar.js
```
function hello(session, order, cb){
	var model = session.getModel('foobar');
	model['me'] = 'world';
	session.addJob(
		order.api,
		order.reqId,
		undefined,
		undefined,
		G_PICO_WEB.RENDER_FULL,
		[[session.createModelInfo('foobar', 'me')]]
	);
	cb();
}
exports.setup = function(context, next){
	var web = context.webServer;
	web.route('Hello', [hello]);
    next();
};
```

8. run the server in YOUR_PROJ_DIR
```
node app
```
9. run following curl command on your local machine
```
curl -X POST -H "Content-Type: application/json" -d '[{"api":"Hello","reqId":1,"data":""}]' http://YOUR_SERVER_IP:5678/pull
```
Configuration
=============
pico server has two types of configuration files, master process configuration and worker process configuration. every 
pico server must has one master process and zero to unlimited numbers of worker processes.
==Web Server Config==
```
"webServer":{
    "mod":"web",
    "port":56789,
    "secretKey":"b0nnIe",
    "cullAge":120000,
    "updateRate":60000,
    "delimiter":["crlf"]
},
```
* webServer: library name, compulsary but name can be any string
* mod: module name, compulsary, must use "web" for web server
* secretKey: request hash key, optional, if not available, request hash will not be checked
* cullAge: request time check, optional, if not available, +- 1 hour allowanceis given
* updateRate: long polling request update rate (milliseconds), optional
* delimiter: for client without ajax, delimiter can be added to separate response, optional
