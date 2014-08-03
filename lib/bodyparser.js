const
// PACKET TYPE
PT_CHANNEL = 1,
PT_HEADER = 2,
PT_BODY = 3

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
            try{
                while(chunk){
                    endPos = chunk.indexOf(sep)
                    if (-1 === endPos) break
                    switch(pt){
                    case PT_CHANNEL:
                        orders.push(chunk.substring(0, endPos)) 
                        pt = PT_HEADER
                        break
                    case PT_HEADER:
                        head = JSON.parse(chunk.substring(0, endPos))
                        body = []
                        pt = (head.len > 0) ? PT_BODY : PT_HEADER
                        break
                    case PT_BODY:
                        body.push(chunk.substring(0, endPos))
                        if (head.len ==< body.length){
                            pt = PT_HEADER
                            auth(head, body, function(err){
                                if (err){
                                    chunk = null
                                    return error(err)
                                }
                                head.data = JSON.parse(body[0], function(k, v){
                                    if ('json' === k) return body[v]
                                    return v
                                })
                            })
                        }
                        break
                    }
                    chunk = chunk.substr(endPos+sepLen)
                }
            }catch(exp){
                return error(exp)
            }
            req.unshift(chunk)
        })
        req.on('end', function(){
            cb(orders ? null : 'missing or invalid orders', orders)
        })
    }
}
