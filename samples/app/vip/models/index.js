module.exports = [
    require('./redis/channelStorage'),

    require('./sql/business'),
    require('./sql/businessTag'),
    require('./sql/device'),
    require('./sql/flyer'),
    require('./sql/follow'),
    require('./sql/user'),
    require('./sql/tag'),
];
