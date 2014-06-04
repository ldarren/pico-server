const
MODEL = 'user',
ME = 'me';

var sql = require('../models/sql/user');

module.exports = {
    read: function(session, order, next){
        sql.read(order.username, function(err, result){
            if (err) return next(err);

            var model = session.getModel(MODEL);
            model[ME] = result;
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, ME)]]
            );

            next();
        });
    },
};
