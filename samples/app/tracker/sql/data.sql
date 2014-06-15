USE `tracker`;

INSERT INTO `driver` (id, name, createdAt) VALUES
(1, 'Eddie Choo', NOW()),
(2, 'Leslie Lawe', NOW()),
(3, 'Sham', NOW()),
(4, 'Peter', NOW()),
(5, 'Peh', NOW()),
(6, 'Ken Goh', NOW()),
(7, 'Steven', NOW());

INSERT INTO `vehicle` (id, tag, seater, model, createdAt) VALUES
(1, 'PC1449C', 13, 'TOYOTA', NOW()),
(2, 'PC964M', 13, 'TOYOTA', NOW()),
(3, 'PC2040R', 13, 'TOYOTA', NOW()),
(4, 'PC1906A', 13, 'TOYOTA', NOW()),
(5, 'PC1814G', 13, 'TOYOTA', NOW()),
(6, 'PC1633L', 13, 'TOYOTA', NOW()),
(7, 'PA7668H', 10, 'TOYOTA', NOW()),
(8, 'SGY1208Y', 4, 'E200', NOW()),
(9, 'SGG5419Z', 13, 'ALPHARD', NOW());

INSERT INTO `jobType` (id, name, createdAt) VALUES
(1, 'Arrival', NOW()),
(2, 'Departure', NOW()),
(3, 'Disposal', NOW()),
(4, 'Events', NOW()),
(5, 'Fit', NOW()),
(6, 'Group Tour', NOW()),
(7, 'Transfer', NOW()),
(8, 'Wedding', NOW()),
(9, 'World Holiday', NOW()),
(10, 'Others', NOW());

INSERT INTO `paymentType` (id, name, createdAt) VALUES
(1, 'Cash', NOW()),
(2, 'Credit', NOW());
