const
MULTIPART_START = 1,
MULTIPART_NAME = 2,
MULTIPART_FIELD_SPACE = 3,
MULTIPART_FIELD_VALUE = 4,
MULTIPART_FILE_TYPE = 5,
MULTIPART_FILE_SPACE = 6,
MULTIPART_FILE = 7,
DRAIN = 'drain',
END = 'end',
DATA = 'data',
ERR = 'error',
UTF8 = 'utf8',
BIN = 'binary',
FNAME = 'filename',
NAME = 'name',
PATH = '/tmp/',
COL = ':',
SEMI_COL = ';',
EQ = '=',
EMPTY = '',
SLASH = '/',
REGEX = new RegExp(/(^"|"$)/g),
CRLF = new Buffer('\r\n'),
CRLF_LEN = CRLF.length

var
fs = require('fs'),
moore = require('./buffer-moore'),
crlfCharTable = moore.makeCharTable(CRLF),
crlfOffsetTable = moore.makeOffsetTable(CRLF),
whiteList = [],
parseContentType = function(contentType){
    var
    output = {},
    type,arr,
    types = contentType.split(SEMI_COL)
    for(var i=0,l=types.length; i<l; i++){
        type = types[i]
        if (-1 === type.indexOf(EQ)) continue
        arr = type.split(EQ)
        output[arr[0].trim()] = arr[1].replace(REGEX, EMPTY)
    }
    return output
},
makeOrder = function(order, path, data){
    if (!order || !path || undefined === data) return
    var
    value = isFinite(data) ? parseInt(data) : NaN, // isFinite is faster than parseInt
    arr = path.split(SLASH),
    container = order,
    key

    while(arr.length > 1){
        key = arr.shift()
        container = container[key] = container[key] || {}
    }
    container[arr[0]] = isNaN(value) ? data : value
},
fillFile = function(req, chunk, file, sep, charTable, offsetTable){
    if (!file) return chunk
    var pos = moore.indexOf(sep, chunk, charTable, offsetTable)
    if (pos < 0){
//console.log('write full', chunk.length)
        if (!file.write(chunk, BIN)) req.pause()
        return undefined
    } else {
//console.log('write partial', pos, chunk.length)
        if (!file.write(chunk.slice(0, pos), BIN)) req.pause()
        return chunk.slice(pos)
    }
},
closeFile = function(file, order, obj){
    if (file){
        makeOrder(order, obj[NAME], {
            filename: obj[FNAME],
            contentType: obj['Content-Type']
        })
//console.log('close file', obj)
        file.end()
    }
}

module.exports = {
    setup: function(list){
        whiteList = list || []
    },
    parse: function(req, cb){
        var
        order= {},
        sep = new Buffer('--'+parseContentType(req.headers['content-type'])['boundary']),
        sepCharTable = moore.makeCharTable(sep),
        sepOffsetTable = moore.makeOffsetTable(sep),
        remain,remainStr = EMPTY,
        state = MULTIPART_START,
        nextNL,obj,arr,file,key

        req.on(END, function(){
            cb(null, order)
        })
        req.on(DATA, function(chunk){
    //console.log('@@@ new chunk', 1024 > chunk.length ? chunk.toString() : chunk.length, typeof file)
            remain = fillFile(req, chunk, file, sep, sepCharTable, sepOffsetTable)
            if (remain){
                if (file){
                    file = closeFile(file, order, obj)
                    state = MULTIPART_START
                }
            }else{
                return
            }
            while(remain && remain.length){
                nextNL = moore.indexOf(CRLF, remain, crlfCharTable, crlfOffsetTable)
                if (nextNL < 0) {
                    remainStr += remain.toString()
                    remain = undefined
                    break
                }
                remainStr += remain.toString(UTF8, 0, nextNL)
    //console.log('remainStr:', remainStr, obj, order, state)
                remain = remain.slice(nextNL+CRLF_LEN)
                switch(state){
                case MULTIPART_START:
                    if (-1 !== remainStr.indexOf(sep)){
                        state = MULTIPART_NAME
                    }
                    break
                case MULTIPART_NAME:
                    obj = parseContentType(remainStr)
                    if (obj[FNAME]){
                        state = MULTIPART_FILE_TYPE

    //console.log('create new file', obj, remainStr, obj)
                        file = fs.createWriteStream(obj[FNAME] = PATH+obj[FNAME])
                        file.on(ERR, function(err){
                            file.end()
                            state = -1
                            console.error(err)
                            return cb(err, order)
                        })
                        file.on(DRAIN, function(){
                            req.resume()
                        })
                    }else{
                        state = MULTIPART_FIELD_SPACE
                    }
                    break
                case MULTIPART_FIELD_SPACE:
                    state = MULTIPART_FIELD_VALUE
                    break
                case MULTIPART_FIELD_VALUE:
                    key = obj[NAME]
                    if ('api' === key && -1 === whiteList.indexOf(remainStr)){
                        req.pause()
                        return cb('invalid upload: '+remainStr, order)
                    }
                    makeOrder(order, key, remainStr)
                    state = MULTIPART_START
                    break
                case MULTIPART_FILE_TYPE:
                    arr = remainStr.split(COL)
                    obj[arr[0]] = arr[1].trim()
                    state = MULTIPART_FILE_SPACE
                    break
                case MULTIPART_FILE_SPACE:
                    state = MULTIPART_FILE
                    // fall through
                case MULTIPART_FILE:
                    remain = fillFile(req, remain.slice(nextNL), file, sep, sepCharTable, sepOffsetTable)
                    if (remain) {
                        file = closeFile(file, order, obj)
                        remainLen = remain.length
                        state = MULTIPART_START
                    }else{
                        return
                    }
                    nextNL = 0
                    break
                default:
                    console.error('upload reach a dead end: ', state, obj)
                    return cb('invalid upload state: '+state, order)
                }
                remainStr = EMPTY
            }
        })
    }
}

//POST / HTTP/1.1
//Host: 107.20.154.29:4888
//Connection: keep-alive
//Content-Length: 44939
//Cache-Control: no-cache
//Pragma: no-cache
//Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
//Origin: http://dungeon-chronicles.com
//User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.114 Safari/537.36
//Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryjB0OQ2JzNauuxMMO
//Referer: http://dungeon-chronicles.com/tests/upload.html
//Accept-Encoding: gzip,deflate,sdch
//Accept-Language: en-US,en;q=0.8,fil;q=0.6
//------WebKitFormBoundaryjB0OQ2JzNauuxMMO
//Content-Disposition: form-data; name="userId"
//
//1
//------WebKitFormBoundaryjB0OQ2JzNauuxMMO
//Content-Disposition: form-data; name="api"
//
//test
//------WebKitFormBoundaryjB0OQ2JzNauuxMMO
//Content-Disposition: form-data; name="user1"; filename="Expense Report.xls"
//Content-Type: application/octet-stream
//
//
//------WebKitFormBoundaryjB0OQ2JzNauuxMMO--
