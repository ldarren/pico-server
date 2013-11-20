// https://developers.google.com/accounts/docs/OAuth2ServiceAccount
// this code is adapted from https://gist.github.com/PaquitoSoft/4451865
// NOTICE! dun use querystring.escape() use urlEscape instead
const
GET = 'GET', POST = 'POST',
SIGNATURE_ALGORITHM = 'RSA-SHA256',
SIGNATURE_ENCODE_METHOD = 'base64',
AUTH_HEADER = {'alg':'RS256', 'typ':'JWT'},
URL_AUTH = 'https://accounts.google.com/o/oauth2/token',
URL_QUERY = 'https://www.googleapis.com/analytics/v3/data/ga',
HTTP_HEADER = {'Content-Type': 'application/x-www-form-urlencoded'};

var
fs = require('fs'),
path = require('path'),
crypto = require('crypto'),
Ajax = require('./utils').ajax,
keyChain = {},
urlEscape = function(source) {
    return source.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}
base64Encode = function(obj) {
    return urlEscape(new Buffer(JSON.stringify(obj), 'utf8').toString(SIGNATURE_ENCODE_METHOD));
},
readPrivateKey = function(keyPath) {
    if (!keyChain[keyPath]) {
        keyChain[keyPath] = fs.readFileSync(keyPath, 'utf8');
    }
    return keyChain[keyPath];
},
authHeader = base64Encode(AUTH_HEADER)+'.';

function CoreReportingV3(account, keyPath, viewId){
    this.signatureKey = readPrivateKey(keyPath);
    this.authClaimSet = {
        iss: account, // Service account email
        scope: 'https://www.googleapis.com/auth/analytics.readonly', // We MUST tell them we just want to read data
        aud: 'https://accounts.google.com/o/oauth2/token',
        exp: 0, // Token valid for 5 mins
        iat: 0
    };
    this.authBody = {'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion': ''};
    this.requestConfig = {ids: 'ga:'+viewId};
    this.gaResult = {startTime:0, expires_in:0};
}

CoreReportingV3.prototype = {
    authorize: function(cb) {
        var
        me = this,
        now = Math.round(Date.now() / 1000), // Google wants us to use seconds
        gaResult = me.gaResult,
        claimSet = me.authClaimSet;

        if (now - gaResult.startTime < gaResult.expires_in) return cb(null, gaResult);

        claimSet.iat = now;
        claimSet.exp = now + 3600; //token valid for 1 hour

        // Setup JWT source
        var 
        signatureInput = authHeader + base64Encode(claimSet),
        signature = crypto.createSign(SIGNATURE_ALGORITHM).update(signatureInput).sign(me.signatureKey, SIGNATURE_ENCODE_METHOD);

        me.authBody.assertion = signatureInput + '.' + urlEscape(signature); // jwt

        // Send request to authorize this application
        Ajax(POST, URL_AUTH, me.authBody, HTTP_HEADER, function(err, res, data){
            if (err) {
                console.error('ua_reporting', error);
                cb(err);
            } else {
                me.gaResult = gaResult = JSON.parse(data);
                gaResult.startTime = now;
                cb(gaResult.error, gaResult);
            }
        });
    },
    query: function(requestConfig, cb){
        var me = this;
        this.authorize(function(err, gaResult){
            if (err) return cb(err);

            Ajax(GET, URL_QUERY, [requestConfig, me.requestConfig], {Authorization: gaResult.token_type + ' ' + gaResult.access_token}, function(err, res, data){
                if (err) return cb(err);
                var result = JSON.parse(data);
                return cb(result.error, result);
            });
        });
    }
};

module.exports = {
    init: function(appConfig, config, next){
        console.log('Core Reporting API v3: '+config.viewId);
        next(null, new CoreReportingV3(config.account, appConfig.path + path.sep + config.key, config.viewId));
    }
};
