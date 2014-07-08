module.exports = [
    require('./redis/channelStorage'),

    require('./sql/default'),
    require('./sql/job'),
    require('./sql/vehicle'),
    require('./sql/driver'),
];
