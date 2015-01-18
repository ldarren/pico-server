DROP DATABASE IF EXISTS `creator`;
CREATE DATABASE IF NOT EXISTS `creator` DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci;

USE `creator`;

SET storage_engine=INNODB;

CREATE TABLE IF NOT EXISTS `data`(
    `id` SERIAL PRIMARY KEY,
    `type` INT UNSIGNED NOT NULL,
    `status` TINYINT UNSIGNED DEFAULT 1,
    `seen` SMALLINT UNSIGNED DEFAULT 0,
    `seenAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedBy` BIGINT UNSIGNED,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY (`seenAt`),
    KEY (`updatedAt`)
);

CREATE TABLE `map`(
    `id` SERIAL PRIMARY KEY,
    `dataId` BIGINT UNSIGNED NOT NULL,
    `key` INT NOT NULL,
    `val` TEXT,
    `updatedBy` BIGINT UNSIGNED,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `createdBy` BIGINT UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (`dataId`, `key`),
    KEY (`key`)
);

CREATE TABLE `list`(
    `id` SERIAL PRIMARY KEY,
    `dataId` BIGINT UNSIGNED NOT NULL,
    `key` INT NOT NULL,
    `val` TEXT NOT NULL,
    `status` TINYINT UNSIGNED DEFAULT 1,
    `seen` SMALLINT UNSIGNED DEFAULT 0,
    `seenAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedBy` BIGINT UNSIGNED,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `createdBy` BIGINT UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY (`dataId`),
    KEY (`seenAt`)
);

CREATE TABLE `ref`(
    `id` SERIAL PRIMARY KEY,
    `dataId` BIGINT UNSIGNED NOT NULL,
    `refId` BIGINT UNSIGNED NOT NULL,
    `val` TEXT,
    `status` TINYINT UNSIGNED DEFAULT 1,
    `updatedBy` BIGINT UNSIGNED,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `createdBy` BIGINT UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (`dataId`, `refId`),
    KEY (`refId`)
);

CREATE TABLE `key`(
    `id` INT PRIMARY KEY,
    `key` TEXT NOT NULL,
    `status` TINYINT UNSIGNED DEFAULT 1
);
