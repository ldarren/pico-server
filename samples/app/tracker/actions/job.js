const
MODEL = 'job',
ME = 'me',
LIST = 'list';

var sql = require('../models/sql/job');

module.exports = {
    create: function(session, order, next){
        var
        me = this,
        data = order.data;
console.log(data);
        if (!data.caller || !data.mobile || !data.date || !data.time || !data.driver || !data.vehicle || !data.pickup || !data.dropoff)
            return next(G_CERROR['400']);

        sql.create(data, function(err, rows){
            if (err) return next(err);
            if (rows.length) return next(G_CERROR['500']);

            var model = session.getModel(MODEL);
            model[LIST] = {};
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, LIST)]]
            );

            next();
        })
    },
    read: function(session, order, next){
        var data = order.data;
        sql.read(data.start, data.end, function(err, result){
            if (err) return next(err);

            var model = session.getModel(MODEL);
            model[LIST] = result;
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, LIST)]]
            );

            next();
        })
    },
    remove: function(session, order, next){
        sql.remove(order.data.id, function(err, result){
            if (err) return next(err);

            session.addJob(
                G_PICO_WEB.RENDER_HEADER
            );

            next();
        });
    }
};
