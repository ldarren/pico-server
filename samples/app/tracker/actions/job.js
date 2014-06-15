const
MODEL = 'job',
ME = 'me',
LIST = 'list';

var sql = require('../models/sql/job');

module.exports = {
    create: function(session, order, next){
        var
        me = this,
        data = order.data,
        userId = data.userId,
        name = data.name;
console.log(userId, name);
        if (!userId || !name) return next(G_CERROR['400']);
        sql.readByName(userId, name, function(err, rows){
            if (err) return next(err);
            if (rows.length) return next(G_CERROR['400']);

            var model = session.getModel(MODEL);
            model[ME] = {
                createdBy: userId,
                name: name,
                about: data.about,
                logo: data.logo
            };
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, ME)]],
                me, me.save
            );

            next();
        });
    },
    read: function(session, order, next){
        var data = order.data;
        sql.read(data.start, order.end, function(err, result){
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
    remove: function(session, order, next){
        sql.remove(order.data.id, function(err, result){
            if (err) return next(err);

            session.addJob(
                G_PICO_WEB.RENDER_HEADER,
            );

            next();
        });
    }
};
