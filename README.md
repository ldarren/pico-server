pico-server
===========

A lean and mean realtime http server

Features
========
* two channel design, push and pull channel to achieve fast and realtime http server
* data cache to prevent data lost
* efficent user session handling, session only persistence when pull channel dc
* multiple input per query similar to facebook "big pipeline"
* server stream data to client through push channel

Installation
============
1. mkdir [PROJ_DIR]
2. cd [PROJ_DIR]
3. sudo npm install pico-server -g
4. npm link pico-server
5. mkdir app # all your server code should goes here

Setup A Hello World Server
==========================
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
pico.createApp('PATH/TO/APP/', 'CONFIG/PATH'); // pico.createApp('/var/nodes/YOUR_PROJ_DIR/app', 'config/master');
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
};
```

8. run the server in YOUR_PROJ_DIR, node app -c config/master
9. test the server with chrome extension's postman. install it from chrome webstore
10. in postman, choose POST action, data type choose RAW and json, target: http://YOUR_SERVER_IP:5678/post, payload
```
{
  "api": "Hello",
  "reqId": 1,
  "data": ""
}
```
