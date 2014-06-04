const
MODEL = 'business',
ME = 'me',
LIST = 'list';

var sql = require('../models/sql/business');

module.exports = {
    create: function(session, order, next){
        sql.create(order.list, function(err, result){
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
    read: function(session, order, next){
        sql.read(order.list, function(err, result){
            if (err) return next(err);

            var model = session.getModel(MODEL);
            model[LIST] = result;
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, LIST)]]
            );

            next();
        });
    },
};
