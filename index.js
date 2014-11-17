require('pico-common') // execute common const

var
utils = require('./lib/utils'),
apiList = utils.apiList,
api

for (var i=0,l=apiList.length; i<l; i++){
    api = apiList[i]
    exports[api] = utils[api]
}
