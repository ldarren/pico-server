require('./const.js');

var
fs = require('fs'),
path = require('path'),
cluster = require('cluster'),
redis = require('redis'),
exec = require('child_process').exec,
