const
GET = 'SELECT id, name FROM business WHERE createdBy IN $1;';

var client;

module.exports = {
    setup: function(context, next){
        client = context.sqlVIPBusiness;
        next();
    },

    read: function(cb){
        client.query(GET, cb);
    }
};
