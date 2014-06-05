const
GET = 'SELECT id, name FROM user WHERE createdBy IN (?);',
CREATE = 'INSERT INTO user (name, about, createdBy, createdAt) VALUES (?, ?, ?, NOW());',
UPDATE = 'UPDATE user SET ?;',
REMOVE = 'UPDATE user SET status=0, updatedBy=?;';

var client;

module.exports = {
    setup: function(context, next){
        client = context.sqlVIPUser;
        next();
    },

    create: function(name, about, createdBy, cb){
        client.query(CREATE, [name, about || null], createdBy, cb);
    },

    read: function(arr, cb){
        client.query(GET, [arr], cb);
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
