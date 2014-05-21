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

const
MULTIPART_START = 1,
MULTIPART_NAME = 2,
MULTIPART_FIELD_SPACE = 3,
MULTIPART_FIELD_VALUE = 4,
MULTIPART_FILE_TYPE = 5,
MULTIPART_FILE_SPACE = 6,
MULTIPART_FILE = 7,
CRLF = '\r\n',
CRLF_LEN = CRLF.length;

var
fs = require('fs'),
parseContentType = function(contentType){
    var
    output = {},
    type,arr,
    types = contentType.split(';');
    for(var i=0,l=types.length; i<l; i++){
        type = types[i];
        if (-1 === type.indexOf('=')) continue;
        arr = type.split('=');
        output[arr[0].trim()] = arr[1].replace(/(^"|"$)/g, '');
    }
    return output;
},
makeOrder = function(order, path, data){
    if (!order || !path || undefined === data) return;
    var
    value = isFinite(data) ? parseInt(data) : NaN, // isFinite is faster than parseInt
    arr = path.split('/'),
    container = order,
    key;

    while(arr.length > 1){
        key = arr.shift();
        container = container[key] = container[key] || {};
    }
    container[arr[0]] = isNaN(value) ? data : value;
},
fillFile = function(req, chunk, file, sep, sepLen){
    if (file){
        var
        pos = 0,
        chunkLen = chunk.length;

        while(pos+sepLen <= chunkLen && -1 === chunk.toString('ascii', pos, pos+sepLen).indexOf(sep)){pos++}
        if (pos + sepLen > chunkLen) pos = chunkLen;
        if (pos === chunkLen){
//console.log('write full', chunk.toString());
            if (!file.write(chunk, 'binary')) req.pause();
            return undefined;
        } else {
//console.log('write partial', chunk.toString('utf8', 0, pos));
            if (!file.write(chunk.slice(0, pos), 'binary')) req.pause();
            return chunk.slice(pos);
        }
    }else{
        return chunk;
    }
},
closeFile = function(file, order, obj){
    if (file){
        makeOrder(order, obj['name'], {
            filename: obj['filename'],
            contentType: obj['Content-Type']
        });
        file.end();
    }
};

module.exports = function(req, res, contentType, cb){
    var
    order= {},
    sep = '--'+parseContentType(contentType)['boundary'],sepLen=sep.length,
    remain,remainLen,remainStr = '',
    state = MULTIPART_START,
    currNL,nextNL,obj,arr,file,filename;

//console.log('boundary', sep, sepLen);

    if ('string' !== typeof sep) return cb(req, res, [order]);
    req.on('end', function(){
        order.data = JSON.stringify(order.data);
        cb(req, res, [order]);
    });
    req.on('data', function(chunk){
//console.log('@@@ new chunk', chunk.toString());
        remain = fillFile(req, chunk, file, sep, sepLen);
        if (remain){
            closeFile(file, order, obj);
            state = MULTIPART_START;
        }else{
            return;
        }
        remainLen = remain.length;
        currNL = nextNL = 0;
        while(nextNL + CRLF_LEN <= remainLen){
            while(nextNL + CRLF_LEN <= remainLen && -1 === remain.toString('ascii', nextNL, nextNL+CRLF_LEN).indexOf(CRLF)){nextNL++}
//console.log('currNL, nextNL', currNL, nextNL);
            remainStr += remain.toString('utf8', currNL, nextNL);
//console.log('###',state,'###',remainStr, order, obj);
            nextNL += CRLF_LEN;
            switch(state){
            case MULTIPART_START:
                if (-1 !== remainStr.indexOf(sep)){
                    state = MULTIPART_NAME;
                }
                break;
            case MULTIPART_NAME:
                obj = parseContentType(remainStr);
                if (obj['filename']){
                    filename = '/tmp/'+obj['filename'];
                    obj['filename'] = filename;
                    state = MULTIPART_FILE_TYPE;

                    file = fs.createWriteStream(filename);
                    file.on('error', function(err){
                        console.error(err);
                        file.end();
                        state = -1;
                        return cb(req, res, [order]);
                    });
                    file.on('drain', function(){
//console.log('write stream drained');
                        req.resume();
                    });
                }else{
                    state = MULTIPART_FIELD_SPACE;
                }
                break;
            case MULTIPART_FIELD_SPACE:
                state = MULTIPART_FIELD_VALUE;
                break;
            case MULTIPART_FIELD_VALUE:
                makeOrder(order, obj['name'], remainStr);
                state = MULTIPART_START;
                break;
            case MULTIPART_FILE_TYPE:
                arr = remainStr.split(':');
                obj[arr[0]] = arr[1].trim();
                state = MULTIPART_FILE_SPACE;
                break;
            case MULTIPART_FILE_SPACE:
                state = MULTIPART_FILE;
                // fall through
            case MULTIPART_FILE:
                remain = fillFile(req, remain.slice(nextNL), file, sep, sepLen);
                if (remain) {
//console.log('MULTIPART_FILE remain', remain.toString());
                    closeFile(file, order, obj);
                    remainLen = remain.length;
                    state = MULTIPART_START;
                }else{
                    return;
                }
                nextNL = 0;
                break;
            default:
                console.error('upload reach a dead end: ', state, obj);
                return;
            }
            currNL = nextNL;
            remainStr = '';
        }
        if (currNL < remainLen) remainStr = remain.toString('ascii', currNL);
    });
};
