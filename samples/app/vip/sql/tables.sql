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
    KEY (`username`)
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

CREATE TABLE IF NOT EXISTS `company`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `about` VARCHAR(255),
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
    `companyId` BIGINT NOT NULL,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY (`userId`),
    KEY (`companyId`)
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

CREATE TABLE IF NOT EXISTS `companyTag`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `companyId` BIGINT NOT NULL,
    `tagId` BIGINT NOT NULL,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY (`companyId`),
    KEY (`tagId`)
);

CREATE TABLE IF NOT EXISTS `flyer`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `page` TINYINT(8) DEFAULT 0,
    `companyId` BIGINT NOT NULL,
    `startAt` DATETIME,
    `endAt` DATETIME,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY (`companyId`)
);
