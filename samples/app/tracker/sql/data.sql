USE `tracker`;

INSERT INTO `field` (`display`, `name`, `locale`, `module`, `type`, `order`, `options`, `placeholder`, `pattern`) VALUES
('Caller', 'caller', 'en', 'job', 1, 1,  NULL, 'Caller name', NULL),
('Date', 'date', 'en', 'job', 3, 2, NULL, 'pickup date', NULL),
('Time', 'time', 'en', 'job', 4, 3, NULL, 'pickup time', NULL),
('Driver', 'driver', 'en', 'job', 10, 4, 'driver', 'select a driver', NULL),
('Vehicle', 'vehicle', 'en', 'job', 10, 5, 'vehicle', 'select a vehicle', NULL),
('Mobile', 'mobile', 'en', 'job', 5, 6, NULL, 'caller mobile', NULL),
('Pickup', 'pickup', 'en', 'job', 1, 7, NULL, 'pickup location', NULL),
('Drop off', 'dropoff', 'en', 'job', 1, 8, NULL, 'drop off location', NULL),
('Job Type', 'type', 'en', 'job', 10, 9, 'jobType', 'select a job type', NULL),
('Payment Type', 'payment', 'en', 'job', 10, 10, 'paymentType', 'select a payment type', NULL),
('Charges', 'charges', 'en', 'job', 2, 11, NULL, 'charge amount', NULL);

INSERT INTO `fieldType` (id, name) VALUES
(1, 'text'),
(2, 'number'),
(3, 'date'),
(4, 'time'),
(5, 'tel'),
(6, 'email'),
(7, 'file'),
(8, 'radio'),
(9, 'checkbox'),
(10, 'select'),
(11, 'select,multi');

INSERT INTO `driver` (id, name) VALUES
(1, 'Eddie Choo'),
(2, 'Leslie Lawe'),
(3, 'Sham'),
(4, 'Peter'),
(5, 'Peh'),
(6, 'Ken Goh'),
(7, 'Steven');

INSERT INTO `vehicle` (id, tag, seater, model) VALUES
(1, 'PC1449C', 13, 'TOYOTA'),
(2, 'PC964M', 13, 'TOYOTA'),
(3, 'PC2040R', 13, 'TOYOTA'),
(4, 'PC1906A', 13, 'TOYOTA'),
(5, 'PC1814G', 13, 'TOYOTA'),
(6, 'PC1633L', 13, 'TOYOTA'),
(7, 'PA7668H', 10, 'TOYOTA'),
(8, 'SGY1208Y', 4, 'E200'),
(9, 'SGG5419Z', 13, 'ALPHARD');

INSERT INTO `const` (id, name, cat) VALUES
(1, 'Arrival', 'job'),
(2, 'Departure', 'job'),
(3, 'Disposal', 'job'),
(4, 'Events', 'job'),
(5, 'Fit', 'job'),
(6, 'Group Tour', 'job'),
(7, 'Transfer', 'job'),
(8, 'Wedding', 'job'),
(9, 'World Holiday', 'job'),
(10, 'Others', 'job'),
(1, 'Cash', 'payment'),
(2, 'Credit', 'payment');
