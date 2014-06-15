const
ALLOW_UPDATE = ['name', 'email', 'password'],
GET = 'SELECT * FROM user WHERE id = ?;',
GET_BY_EMAIL = 'SELECT * FROM user WHERE email = ?;',
CREATE = 'INSERT INTO user (name, email, password, createdBy, createdAt) VALUES (?, ?, ?, ?, NOW());',
UPDATE = 'UPDATE user SET ? WHERE id=?;',
REMOVE = 'UPDATE user SET status=0, updatedBy=? WHERE id=?;';

var client;

module.exports = {
    setup: function(context, next){
        client = context.sqlVIPUser;
        next();
    },

    create: function(name, email, password, createdBy, cb){
        client.query(CREATE, [name, email, password, createdBy], cb);
    },

    read: function(userId, cb){
        client.query(GET, [userId], cb);
    },

    readByEmail: function(email, cb){
        client.query(GET, [email], cb);
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
