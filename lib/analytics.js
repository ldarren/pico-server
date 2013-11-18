const
POST = 'post',
END_POINT = 'http://www.google-analytics.com/collect',
END_POINT_SSL = 'https://ssl.google-analytics.com/collect';

var
http = require('http'),
Ajax = require('./utils').ajax,
MergeObj = require('./utils').mergeObj,
UniversalAnalytics = function(config){
    this.href = config.secure ? END_POINT_SSL : END_POINT;
    this.generalParams = {
        v: 1, // version, current measurement tool version is 1
        tid: config.trackingId,
        cid: config.defaultClientId,
    };
    if (config.options) this.generalParams = MergeObj(this.generalParams, config.options);
    this.defaultParams = MergeObj({}, this.generalParams);
    console.log('analytics ['+this.defaultParams.tid+'] ['+this.defaultParams.cid+']:',this.href);
};

UniversalAnalytics.prototype = {
    addParams: function(params){
        var data = {};
        if (params) data = MergeObj(data, params);
        this.defaultParams = MergeObj(data, this.generalParams);
        return this;
    },
    client: function(id){
        this.commonParams.cid = id;
        return this.addParams();
    },
    experiment: function(id, variant){
        var params = this.generalParams;
        params.xid = id;
        params.xvar = variant;
        return this.addParams();
    },
    dimension: function(id, val){
        if ('number' !== typeof(id) || id < 1 || id > 200 || !val){
            console.error('invalid custom dimension', id, val);
        }
        this.generalParams['cd'+id] = ''+val;
        return this.addParams();
    },
    metric: function(id, val){
        if ('number' !== typeof(id) || id < 1 || id > 200 || !val || 'number' !== typeof(val)){
            console.error('invalid custom metric', id, val);
        }
        this.generalParams['cm'+id] = val;
        return this.addParams();
    },
    pageview: function(hostname, path, title){
        var params = {
            t: 'pageview',
            dh: hostname, // Document hostname, 107.20.154.29:56789
            dp: path, // page, /login
            dt: title // title, loginPage
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    appview: function(appName, version, screenName){
        var params = {
            t: 'appview',
            an: appName, // ifactory
            av: version, // 0.0.1
            cd: screenName // shop
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    event: function(category, action, label, value){
        var params = {
            t: 'event',
            ec: category,// shop
            ea: action, // click
            el: label, // buy, optional
            ev: value // integer value, this value will be presented in total and average, optional
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    transaction: function(transactionId, affiliation, revenue, shipping, tax, currency){
        var params = {
            t: 'transaction',
            ti: transactionId,
            ta: affiliation, // category, eg. member or store name, optional
            tr: revenue, // selling price, decimal, optional
            ts: shipping, // shipping cost, decimal, optional
            tt: tax, // tax cost, decimal, optional
            cu: currency // a valid ISO 4217 currency code, optional
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    item: function(transactionId, name, price, quantity, sku, category, currency){
        var params = {
            t: 'item',
            ti: transactionId,
            in: name, // product name
            ip: price, // item price per unit, optional
            iq: quantity, // item quantity, optional
            ic: sku, // item id or item code, optional
            iv: category, // item category, optioanl
            cu: currency // valid ISO 4217 currency code, optional
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    social: function(network, action, target){
        var params = {
            t: 'social',
            sa: action, // like
            sn: network, // facebook
            st: target // ritb
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    exception: function(desc, fatal){
        var params = {
            t: 'exception',
            exd: description, // mysql ioexception
            exf: fatal ? 1 : 0 // 1 or 0
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    // times = {dns:msec, pdt:msec, plt:msec, rrt:msec, tcp:msec, srt:msec}
    // dns: dns time, pdt: page downloading time, plt: page loading time, rrt: redirect time, tcp: tcp connect time, srt: server response time
    timing: function(category, variable, time, label, times){
        var params = {
            t: 'timing',
            utc: category,
            utv: variable,
            utt: time,
            utl: label
        };
        Ajax(POST, this.href, [this.defaultParams, params, times || {}]);
        return this;
    }
};

module.exports = {
    init: function(appConfig, config, next){
        return next(null, new UniversalAnalytics(config));
    }
};
