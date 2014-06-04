const
LOGO_PATH = '/var/node/sandbox/logo/',
MODEL = 'business',
ME = 'me',
LIST = 'list';

var
fs = require('fs'),
sql = require('../models/sql/business'),
moveLogo = function(src, id, cb){
    if (!src) return cb();
    fs.rename(src, LOGO_PATH+id, cb);
};

module.exports = {
    create: function(session, order, next){
        var
        me = this,
        data = order.data,
        userId = data.userId,
        name = data.name,
        logo = data.logo;
        if (!userId || !name) return next(G_CERROR['400']);
        sql.readByName(userId, name, function(err, rows){
            if (err) return next(err);
            if (rows.length) return next(G_CERROR['400']);

            var model = session.getModel(MODEL);
            model[ME] = {
                userId: userId,
                name: name,
                about: data.about
            };
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, ME)]],
                me, me.save
            );

            next();
        });
    },
    save: function(models, cb){
        var
        data = models[0],
        userId = data.userId,
        name = data.name,
        about = data.about;

        sql.create(data.name, data.about, data.userId, function(err, result){
            if (err) cb(err);
            data.id = result.insertId;
            cb(null, models);
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
