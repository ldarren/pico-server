const
GET = 'SELECT id, name FROM companyTag WHERE createdBy IN (?);',
CREATE = 'INSERT INTO companyTag (name, about, createdBy, createdAt) VALUES (?, ?, ?, NOW());',
REMOVE = 'UPDATE companyTag SET status=0, updatedBy=?;';

var client;

module.exports = {
    setup: function(context, next){
        client = context.sqlVIPCompanyTag;
        next();
    },

    create: function(name, about, createdBy, cb){
        client.query(CREATE, [name, about || null], createdBy, cb);
    },

    read: function(arr, cb){
        client.query(GET, [arr], cb);
    },

    remove: function(updatedBy, cb){
        client.query(REMOVE, [updatedBy], cb);
    }
};

