module.exports = [
    require('./redis/channelStorage'),

    require('./sql/constant'),
    require('./sql/patient'),
    require('./sql/issue'),
    require('./sql/result'),
    require('./sql/transfer'),
    require('./sql/history'),
];
