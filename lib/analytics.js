const
END_POINT = 'http://www.google-analytics.com/collect',
END_POINT_SSL = 'https://ssl.google-analytics.com/collect';

var
http = require('http'),
analytics = [],
UniversalAnalytics = function(config){
    this.commonParams = 'v=1&tid='+config.trackingId+'&cid='+config.clientId;
};

UniversalAnalytics.prototype = {
    sendPageView = function(tag){

    }
};

module.exports = {
    init: function(appConfig, config, next){
        var ua = new UniversalAnalytics(config);
        analytics.push(ua);
        return next(null, ua);
    }
};
