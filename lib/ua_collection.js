// https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide
const
POST = 'POST',
END_POINT = 'http://www.google-analytics.com/collect',
END_POINT_SSL = 'https://ssl.google-analytics.com/collect';

var
http = require('http'),
extend = require('pico-common').obj.extend,
Ajax = require('./utils').ajax,
MeasurementProtocol = function(config){
    this.href = config.secure ? END_POINT_SSL : END_POINT;
    this.generalParams = {
        v: 1, // version, current measurement tool version is 1
        tid: config.trackingId,
        cid: config.defaultClientId,
    };
    if (config.options) this.generalParams = extend(this.generalParams, config.options);
    this.defaultParams = extend({}, this.generalParams);
    this.session = {};
    console.log('ua collection ['+this.defaultParams.tid+'] ['+this.defaultParams.cid+']:',this.href);
};

MeasurementProtocol.prototype = {
    addParams: function(params){
        var data = {};
        if (params) data = extend(data, params);
        this.defaultParams = extend(data, this.generalParams);
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
            console.error('ua collection: invalid custom dimension', id, val);
            return this;
        }
        this.generalParams['cd'+id] = ''+val;
        return this.addParams();
    },
    metric: function(id, val){
        if ('number' !== typeof(id) || id < 1 || id > 200 || !val || 'number' !== typeof(val)){
            console.error('ua collection: invalid custom metric', id, val);
            return this;
        }
        this.generalParams['cm'+id] = val;
        return this.addParams();
    },
    pageview: function(page, title, host){
        if (!page){
            console.error('ua collection: pageview without page');
            return this;
        }
        this.session['dp'] = page;
        var params = {
            t: 'pageview',
            dh: host, // Document hostname, 107.20.154.29:56789
            dp: page, // page, /login
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
            cd: screenName // content description
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    event: function(category, action, label, value){
        if (!category || !action){
            console.error('ua collection: event trigger without category or action', category, action);
            return this;
        }
        var params = {
            t: 'event',
            ec: category,// shop
            ea: action, // click
            el: label, // buy, optional
            ev: value, // integer value, this value will be presented in total and average, optional
            p: this.session['dp']
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    transaction: function(transactionId, affiliation, revenue, shipping, tax, currency){
        if (!transactionId){
            console.error('ua collection: transaction without transactionId');
            return this;
        }
        this.session['ti'] = transactionId;
        var params = {
            t: 'transaction',
            ti: transactionId,
            ta: affiliation, // category, eg. member or store name, optional
            tr: revenue, // selling price, decimal, optional
            ts: shipping, // shipping cost, decimal, optional
            tt: tax, // tax cost, decimal, optional
            cu: currency, // a valid ISO 4217 currency code, optional
            p: this.session['dp']
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    item: function(name, price, quantity, sku, category, currency){
        var ti = this.session['ti'];
        if (!ti || !name){
            console.error('ua collection: itemHit without transactionId or item name', ti, name);
            return this;
        }
        var params = {
            t: 'item',
            ti: ti,
            in: name, // product name
            ip: price, // item price per unit, optional
            iq: quantity, // item quantity, optional
            ic: sku, // item id or item code, optional
            iv: category, // item category, optional
            cu: currency, // valid ISO 4217 currency code, optional
            p: this.session['dp']
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    social: function(network, action, target){
        if (!network || !action || !target){
            console.error('ua collection: social hit without network or action or target', network, action, target);
            return this;
        }
        var params = {
            t: 'social',
            sa: action, // like
            sn: network, // facebook
            st: target, // ritb
            p: this.session['dp']
        };
        Ajax(POST, this.href, [this.defaultParams, params]);
        return this;
    },
    exception: function(desc, fatal){
        var params = {
            t: 'exception',
            exd: description, // mysql ioexception
            exf: fatal ? 1 : 0, // 1 or 0
            p: this.session['dp']
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
            utl: label,
            p: this.session['dp']
        };
        Ajax(POST, this.href, [this.defaultParams, params, times || {}]);
        return this;
    }
};

module.exports = {
    init: function(appConfig, config, next){
        return next(null, new MeasurementProtocol(config));
    }
};
