const
GET = 'SELECT id, name FROM device WHERE createdBy IN (?);',
UPDATE = 'INSERT INTO device (name, about, createdBy, createdAt) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE ?;';

var client;

module.exports = {
    setup: function(context, next){
        client = context.sqlVIPDevice;
        next();
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
    }
};
