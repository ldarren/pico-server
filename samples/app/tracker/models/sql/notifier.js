const
GET_CREDENTIAL = 'SELECT id, key FROM ?? WHERE app=?;',
GET_DEVICE = 'SELECT platform, token FROM ?? WHERE uuid=?;'

var
DB = module.exports = {
    credentialDB: 'credential',
    deviceDB: 'device',
    client: null,
}

DB.prototype = {
    setup: function(credential, device, sqlClient){
        this.credentialDB = credential 
        this.deviceDB = device 
        this.client = sqlClient
    },
    getCredential: function(app, cb){
        this.client.query(GET_CREDENTIAL, [this.credentailDB, app], function(err, results){
            if (err) return cb(err)
            cb(null, results.pop())
        })
    },
    getDevice: function(uuid, cb){
        this.client.query(GET_DEVICE, [this.deviceDB, uuid], function(err, results){
            if (err) return cb(err)
            cb(null, results.pop())
        })
    }
}
