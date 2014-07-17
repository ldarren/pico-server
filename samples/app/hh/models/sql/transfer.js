const
ALLOW_UPDATE = ['issueId', 'requestedId', 'requesterId'],
LIST = 'SELECT id, issueId, requestedId, requesterId FROM transfer WHERE status=1 LIMIT 100;',
BY_DOCTOR = 'SELECT id, issueId, requestedId, requesterId FROM transfer WHERE requestedId=? AND status=1;',
GET = 'SELECT id, issueId, requestedId, requesterId, status FROM transfer WHERE id=?;',
CREATE = 'INSERT INTO transfer SET ?;',
UPDATE = 'UPDATE transfer SET ? WHERE id=?;',
REMOVE = 'UPDATE transfer SET status=0 WHERE id=?;'

var client

module.exports = {
    setup: function(context, next){
        client = context.sqlHH
        next()
    },

    create: function(data, cb){
        client.query(CREATE, [data], cb)
    },

    list: function(cb){
        client.query(LIST, cb)
    },

    byDoctor: function(doctorId, cb){
        client.query(BY_DOCTOR, [doctorId], cb)
    },

    read: function(id, cb){
        client.query(GET, [id], cb)
    },

    update: function(data, cb){
        var
        ck = Object.keys(data),
        params = {}, key
        for(var i=0,l=ck.length; i<l; i++){
            key = ck[i]
            if (-1 === ALLOW_UPDATE.indexOf(key)) continue
            params[key] = data[key]
        }

        if (!Object.keys(params).length) return cb(G_CERROR['400'])
        client.query(UPDATE, [params, data.id], cb)
    },

    remove: function(id, cb){
        client.query(REMOVE, [id], cb)
    }
}
