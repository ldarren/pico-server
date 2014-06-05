module.exports = [
    require('./redis/channelStorage'),

    require('./sql/company'),
    require('./sql/companyTag'),
    require('./sql/device'),
    require('./sql/flyer'),
    require('./sql/follow'),
    require('./sql/user'),
    require('./sql/tag'),
];
