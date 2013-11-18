var
web = null,
analytics = null,
testResponse = function(session, order, next){
    var model = session.getModel('foobar');
    model['me'] = 'world';
    session.addJob(
        order.api,
        undefined,
        undefined,
        G_PICO_WEB.RENDER_FULL,
        [[session.createModelInfo('foobar', 'me')]]
    );

    analytics.pageview('107.20.154.29','test','testAPI').event('test', 'foobar');
    next();
},
router = {
    setup: function(context, next){
        web = context.webServer;
        analytics = context.ritbAnalytics;

        web.setChannelStorage(require('../models/channelStorage'));
        
        web.route('test', [testResponse]);

        next();
    }
};

module.exports = [
    router
];
