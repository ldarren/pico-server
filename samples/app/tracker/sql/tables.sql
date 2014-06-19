CREATE DATABASE IF NOT EXISTS `tracker`;

USE `tracker`;

CREATE TABLE IF NOT EXISTS `job`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `caller` VARCHAR(64) NOT NULL,
    `mobile` VARCHAR(16) NOT NULL,
    `date` DATE NOT NULL,
    `time` TIME NOT NULL,
    `pickup` VARCHAR(255) NOT NULL,
    `dropoff` VARCHAR(255) NOT NULL,
    `driver` SMALLINT NOT NULL,
    `vehicle` SMALLINT NOT NULL,
    `type` SMALLINT NOT NULL,
    `payment` SMALLINT NOT NULL,
    `charge` SMALLINT DEFAULT 0,
    `status` TINYINT DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT,
    `createdAt` DATETIME,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `driver`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(64)  NOT NULL,
    `mobile` VARCHAR(16),
    `status` TINYINT DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT,
    `createdAt` DATETIME,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `vehicle`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tag` VARCHAR(16) NOT NULL,
    `seater` SMALLINT UNSIGNED DEFAULT 2,
    `model` VARCHAR(16),
    `status` TINYINT DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT,
    `createdAt` DATETIME,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `jobType`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(16) NOT NULL,
    `status` TINYINT DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT,
    `createdAt` DATETIME,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `paymentType`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(16) NOT NULL,
    `status` TINYINT DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT,
    `createdAt` DATETIME,
    PRIMARY KEY (`id`)
);
