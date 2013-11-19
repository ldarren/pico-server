var
web = null,
analytics = null,
reporting = null,
chatResponse = function(session, order, next){
    var model = session.getModel('foobar');
    model['me'] = 'world';
    session.addJob(
        order.api,
        undefined,
        undefined,
        G_PICO_WEB.RENDER_FULL,
        [[session.createModelInfo('foobar', 'me')]]
    );

    analytics.pageview('/chat','Chat Room','107.20.154.29').event('chat', 'send');
    next();
},
listResponse = function(session, order, next){
    var model = session.getModel('foobar');
    model['me'] = 'world';
    session.addJob(
        order.api,
        undefined,
        undefined,
        G_PICO_WEB.RENDER_FULL,
        [[session.createModelInfo('foobar', 'me')]]
    );

    next();
},
router = {
    setup: function(context, next){
        web = context.webServer;
        analytics = context.chatUACollection;
        reporting = context.chatUAReporting;

        web.setChannelStorage(require('../models/channelStorage'));
        
        web.route('chat', [chatResponse]);
        web.route('list', [listResponse]);

        next();
    }
};

module.exports = [
    router
];
