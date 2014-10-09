var
gcm = require('node-gcm'),
apn = require('apn'),
apnConnected = function(){ console.log('apn connected') },
apnTransmitted = function(notification, device){ console.log('apn send ok', device.token.toString('hex')) },
apnTransmissionError = function(errCode, notification, device){ console.log('apn send ko', errCode, device.token.toString('hex')) },
apnTimeout = function(){ console.log('apn timeout') },
apnDisconnected = function(){ console.log('apn dc') },
gcmResult = function(err, result){
    if (err) return console.error('gcm send ko',err)
    console.log('gcm send ok',result)
},
Notifier = function(options){
    this.gcmConn = new gcm.Sender(options.serverAPIKey)
    this.retry = options.retry || 3
    this.ttl = options.ttl || 0
    this.delay = options.delay || false
    this.dryRun = options.dryRun || false

    var a = this.apnConn = new apn.Connection(options)
    a.on('connected', apnConnected)
    a.on('transmitted', apnTransmitted)
    a.on('transmissionError', apnTransmissionError)
    a.on('timeout', apnTimeout)
    a.on('disconnected', apnDisconnected)
    a.on('socketError', console.error)
}

Notifier.prototype = {
    broadcast: function(tokens, ids, title, content, payload, options){
        options = options || {}
        if (tokens && tokens.length){
            var msg = new apn.Notification()

            content = title ? title+': '+content : content
            content = (107 < content.length) ? content.substring(0, 103)+'&hellip;' : content

            msg.expiry = (Date.now()/1000) + options.ttl || this.ttl
            msg.alert = content
            msg.payload = payload
            msg.sound = 'default'
            msg.badge = 1

            this.apnConn.pushNotification(msg, tokens)
        }
        if (ids && ids.length){
            var msg = new gcm.Message({
                data:{
                    title: title,
                    message: content,
                    data: payload
                },
                collapseKey: title,
                timeToLive: options.ttl || this.ttl,
                delayWhileIdle: options.delay || this.delay,
                dryRun: options.dryRun || this.dryRun
            })
            this.gcmConn.send(msg, ids, options.retry || this.retry, gcmResult)
        }
    }
}

exports.init = function(appConfig, libConfig, next){
    console.log('notifier connected');
    return next(null, new Notifier(libConfig))
}
