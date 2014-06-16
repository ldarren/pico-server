const
ALLOW_UPDATE = ['name', 'about'],
GET = 'SELECT * FROM job;',
GET_BY_NAME = 'SELECT id FROM job WHERE createdBy = ? AND name = ?;',
CREATE = 'INSERT INTO job SET ?;',
UPDATE = 'UPDATE job SET ?;',
REMOVE = 'UPDATE job SET status=0, updatedBy=?;';

var client;

module.exports = {
    setup: function(context, next){
        client = context.sqlTrackerJob;
        next();
    },

    create: function(data, cb){
        client.query(CREATE, [data], cb);
    },

    readByName: function(createdBy, name, cb){
        client.query(GET_BY_NAME, [createdBy, name], cb);
    },

    read: function(start, end, cb){
        client.query(GET, cb);
    },

    update: function(changed, updatedBy, cb){
        var
        ck = Object.keys(changed),
        params = {}, key;
        for(var i=0,l=ck.length; i<l; i++){
            key = ck[i];
            if (-1 === ALLOW_UPDATE.indexOf(key)) continue;
            params[key] = changed[key];
        }
        if (!Object.keys(params).length) return cb(G_CERROR['400']);
        params['updatedBy'] = updatedBy;
        client.query(UPDATE, [params], cb);
    },

    remove: function(updatedBy, cb){
        client.query(REMOVE, [updatedBy], cb);
    }
};
