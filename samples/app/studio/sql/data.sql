USE `innodb_memcache`;

INSERT INTO `containers` (`name`, `db_schema`, `db_table`, `key_columns`, `value_columns`, `flags`, `cas_column`, `expire_time_column`, `unique_idx_name_on_key`) VALUES
('store', 'pico', 'store', 'id', 'json', 'flags', 'cas', 'ttl', 'PRIMARY');

USE `pico`;

INSERT INTO `store` (`id`, `json`) VALUES
('pico/spec/ref',         '{"name":"","type":"ref","value":""}'),
('pico/spec/refs',        '{"name":"","type":"refs","value":""}'),
('pico/spec/model',       '{"name":"","type":"model","value":"","param":0}'),
('pico/spec/models',      '{"name":"","type":"models","value":{"list":"","create":"","read":"","update":"","delete":"","preload":false}}'),
('pico/spec/param',       '{"name":"","type":"param","value":0}'),
('pico/spec/text',        '{"name":"","type":"text","value":""}'),
('pico/spec/number',      '{"name":"","type":"number","value":0}'),
('pico/spec/datetime',    '{"name":"","type":"datetime","value":"2014-07-18T09:18:36.385Z"}'),
('pico/spec/select',      '{"name":"","type":"select","value":[]}'),
('pico/spec/selects',     '{"name":"","type":"selects","value":[]}');
