const
ALLOW_UPDATE = ['desc', 'patientId', 'doctorId'],
LIST = 'SELECT id, `desc`, patientId, doctorId FROM issue WHERE status=1 LIMIT 100;',
BY_DOCTOR = 'SELECT id, `desc`, patientId, doctorId FROM issue WHERE doctorId=? AND status=1;',
BY_LIST = 'SELECT id, `desc`, patientId, doctorId FROM issue WHERE id IN (?) AND status=1;',
GET = 'SELECT json FROM issue WHERE id=?;',
CREATE = 'INSERT INTO issue SET ?;',
UPDATE = 'UPDATE issue SET ? WHERE id=?;',
REMOVE = 'UPDATE issue SET status=0 WHERE id=?;'

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

    byList: function(list, cb){
        if (!list.length) return cb(null, [])
        client.query(BY_LIST, [list], cb)
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
