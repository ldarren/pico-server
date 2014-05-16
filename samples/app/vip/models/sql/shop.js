const
GET_ALL = 'SELECT id, name FROM shop;';

var client;

module.exports = {
    setup: function(context, next){
        client = context.sqlVIPShop;
        next();
    },

    getAll: function(cb){
        client.query(GET_ALL, cb);
    }
};
