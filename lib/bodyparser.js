const
// PACKET TYPE
PT_CHANNEL = 1,
PT_HEADER = 2,
PT_BODY = 3,
PT_JSON = 4

var
crypto = require('crypto'),
cullAge, secretKey,
auth = function(head, body, cb){
    if (!body.length) return cb()

    var
    t = head.date,
    dt = Date.now() - t

    if (cullAge && (!t || dt > cullAge || dt < -cullAge)) return cb('timed error request: api['+head.api+']t['+t+']dt['+dt+']')

    if (secretKey){
        var hmac = crypto.createHmac('md5', secretKey+t)
        
        for(var i=0,l=body.length; i<l; i++) hmac.update(body[i]);
        
        var key = hmac.digest('base64')

        if (key !== head.key) return cb('key error request: api['+head.api+']t['+t+']key['+key+']')
    }
    cb()
},
assembly = function(head, body, cb){
    try{
        var data = head.data = JSON.parse(body.shift())
        switch(body.length){
        case 0: break
        case 1: data.json = body[0]; break
        default: data.json = body; break
        }
        return cb(null, head)
    }catch(exp){
        return cb(exp)
    }
}

module.exports = {
    setup: function(age, key){
        cullAge = age
        secretKey = key
    },
    parse: function(req, sep, cb){
        var
        pt = PT_CHANNEL,
        data = '',
        endPos = 0,
        sepLen = sep.length,
        orders = [],
        head, body,
        error = function(err){
            req.pause()
            cb(err)
        }

        req.on('data', function(chunk){
            while(chunk){
                endPos = chunk.indexOf(sep)
                if (-1 === endPos) break
                try{
                    switch(pt){
                    case PT_CHANNEL:
                        orders.push(JSON.parse(chunk.substring(0, endPos))) 
                        pt = PT_HEADER
                        break
                    case PT_HEADER:
                        head = JSON.parse(chunk.substring(0, endPos))
                        body = []
                        pt = (head.len > 0) ? PT_BODY : PT_HEADER
                        break
                    case PT_BODY:
                        body.push(JSON.parse(chunk.substring(0, endPos)))
                        pt = (head.len > 1) ? PT_JSON : PT_HEADER
                        break
                    case PT_JSON:
                        body.push(JSON.parse(chunk.substring(0, endPos)))
                        pt = (head.len ==< json.length) ? PT_HEADER : PT_JSON
                        break
                    }
                }catch(exp){
                    return error(exp)
                }
                chunk = chunk.substr(endPos+sepLen)
                if (pt === PT_HEADER && body && body.length){
                    auth(head, body, function(err){
                        if (err){
                            chunk = null
                            return error(err)
                        }
                        assembly(head, body, function(err, order){
                            if (err){
                                chunk = null
                                return error(err)
                            }
                            orders.push(order)
                        })
                    })
                }
            }
            req.unshift(chunk)
        })
        req.on('end', function(){
            cb(orders ? null : 'missing or invalid orders', orders)
        })
    }
}
