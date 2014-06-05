const
LOGO_PATH = '/var/node/sandbox/logo/',
LOGO_URL = 'http://107.20.154.29/logo/',
MODEL = 'company',
ME = 'me',
LIST = 'list';

var
fs = require('fs'),
sql = require('../models/sql/company'),
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
        name = data.name;

        if (!userId || !name) return next(G_CERROR['400']);
        sql.readByName(userId, name, function(err, rows){
            if (err) return next(err);
            if (rows.length) return next(G_CERROR['400']);

            var model = session.getModel(MODEL);
            model[ME] = {
                userId: userId,
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
    save: function(models, cb){
        var
        data = models[0],
        userId = data.userId,
        name = data.name,
        about = data.about;

        sql.create(data.name, data.about, data.userId, function(err, result){
            if (err) return cb(err);
            data.id = result.insertId;
            moveLogo(data.logo, LOGO_PATH+data.id, function(err){
                if (err) return cb(err);
                cb(null, models);
            });
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
