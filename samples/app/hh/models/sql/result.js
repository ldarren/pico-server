const
ALLOW_UPDATE = ['desc', 'issueId'],
LIST = 'SELECT id, `desc`, issueId FROM result WHERE status=1;',
BY_LIST = 'SELECT id, `desc`, issueId FROM result WHERE issueId IN (?) AND status=1;',
GET = 'SELECT json FROM result WHERE id=?;',
GET_BY_NAME = 'SELECT json FROM result WHERE name=?;',
CREATE = 'INSERT INTO result SET ?;',
UPDATE = 'UPDATE result SET ? WHERE id=?;',
REMOVE = 'UPDATE result SET status=0 WHERE id=?;'

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

    byList: function(list, cb){
        client.query(BY_LIST, [list], cb)
    },

    read: function(id, cb){
        client.query(GET, [id], cb)
    },

    readByName: function(name, cb){
        client.query(GET_BY_NAME, [name], cb)
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
