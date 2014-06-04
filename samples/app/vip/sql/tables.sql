CREATE DATABASE IF NOT EXISTS `vip`;

USE `vip`;

CREATE TABLE IF NOT EXISTS `user`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `password` VARCHAR(64) NOT NULL,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    PRIMARY KEY (`username`)
);

CREATE TABLE IF NOT EXISTS `device`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `platform` VARCHAR(16) NOT NULL,
    `uuid` VARCHAR(64) NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `business`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `message` VARCHAR(160),
    `logo` VARCHAR(64),
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY (`createdBy`)
);

CREATE TABLE IF NOT EXISTS `follow`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `businessId` BIGINT NOT NULL,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY (`userId`),
    KEY (`businessId`)
);

CREATE TABLE IF NOT EXISTS `tag`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `businessTag`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `businessId` BIGINT NOT NULL,
    `tagId` BIGINT NOT NULL,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY (`businessId`),
    KEY (`tagId`)
);

CREATE TABLE IF NOT EXISTS `flyer`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `page` TINYINT(8) DEFAULT 0,
    `businessId` BIGINT NOT NULL,
    `startAt` DATETIME,
    `endAt` DATETIME,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY (`businessId`)
);
