USE `pico`;

INSERT INTO `field` (`id`, `name`, `json`) VALUES
(1, 'text',         '{"name":"text","type":"text","value":""}'),
(2, 'number',       '{"name":"number","type":"number","value":0}'),
(3, 'date',         '{"name":"date","type":"date","value":"01/01/2014"}'),
(4, 'time',         '{"name":"time","type":"time","value":"00:00:00"}'),
(5, 'datetime',     '{"name":"datetime","type":"datetime","value":"01/01/2014 00:00:00"}'),
(6, 'geo',          '{"name":"geo","type":"geo","value":""}'),
(7, 'tel',          '{"name":"tel","type":"tel","value":""}'),
(8, 'email',        '{"name":"email","type":"email","value":""}'),
(9, 'file',         '{"name":"file","type":"file","value":""}'),
(10, 'radio',       '{"name":"radio","type":"radio","value":[{"id":"","name":""}]}'),
(11, 'checkbox',    '{"name":"checkbox","type":"checkbox","value":[{"id":"","name":""}]}');
