module.exports = [
    require('./redis/channelStorage'),

    require('./sql/job'),
    require('./sql/vehicle'),
    require('./sql/driver'),
    require('./sql/jobType'),
    require('./sql/paymentType'),
];
