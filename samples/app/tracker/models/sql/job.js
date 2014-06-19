const
ALLOW_UPDATE = ['name', 'about'],
GET = 'SELECT * FROM job WHERE status=1 ORDER BY date,time ASC;',
GET_START = 'SELECT * FROM job WHERE date>=? AND status=1 ORDER BY date,time ASC;',
GET_START_END = 'SELECT * FROM job WHERE date>=? AND date<=? AND status=1 ORDER BY date,time ASC;',
CREATE = 'INSERT INTO job SET ?;',
UPDATE = 'UPDATE job SET ? WHERE id=?;',
REMOVE = 'UPDATE job SET status=0, updatedBy=? WHERE id=?;'

var client

module.exports = {
    setup: function(context, next){
        client = context.sqlTrackerJob
        next()
    },

    create: function(data, cb){
        client.query(CREATE, [data], cb)
    },

    readByName: function(createdBy, name, cb){
        client.query(GET_BY_NAME, [createdBy, name], cb)
    },

    read: function(start, end, cb){
        if (start && end) client.query(GET_START_END, [start, end], cb)
        else if (start) client.query(GET_START, [start], cb)
        else client.query(GET, cb)
    },

    update: function(changed, updatedBy, cb){
        var
        ck = Object.keys(changed),
        params = {}, key
        for(var i=0,l=ck.length; i<l; i++){
            key = ck[i]
            if (-1 === ALLOW_UPDATE.indexOf(key)) continue
            params[key] = changed[key]
        }
        if (!Object.keys(params).length) return cb(G_CERROR['400'])
        params['updatedBy'] = updatedBy
        client.query(UPDATE, [params], cb)
    },

    remove: function(updatedBy, cb){
        client.query(REMOVE, [updatedBy], cb)
    }
}
