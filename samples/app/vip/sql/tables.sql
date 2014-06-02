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
    PRIMARY KEY (`id`)
)

CREATE TABLE IF NOT EXISTS `group`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `message` VARCHAR(160),
    `logo` VARCHAR(64),
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
)

CREATE TABLE IF NOT EXISTS `follow`(
    `userId` BIGINT NOT NULL,
    `groupId` BIGINT NOT NULL,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`userId`,`groupId`)
)

CREATE TABLE IF NOT EXISTS `tag`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY (`name`)
)

CREATE TABLE IF NOT EXISTS `groupTag`(
    `groupId` BIGINT NOT NULL,
    `tagId` BIGINT NOT NULL,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`groupId`, `tagId`)
)

CREATE TABLE IF NOT EXISTS `flyer`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `page` TINYINT(8) DEFAULT 0,
    `groupId` BIGINT NOT NULL,
    `startAt` DATETIME,
    `endAt` DATETIME,
    `status` BIT(1) DEFAULT 1,
    `updatedBy` BIGINT,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
)
