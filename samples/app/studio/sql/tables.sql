CREATE DATABASE IF NOT EXISTS `pico` DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci;

USE `pico`;

SET storage_engine=INNODB;

CREATE TABLE IF NOT EXISTS `store`(
    `path` VARCHAR(256) NOT NULL,
    `dir` VARCHAR(255),
    `json` TEXT NOT NULL,
    `rule` INT UNSIGNED DEFAULT 0 COMMENT 'byte:creator|group|public, value:0=disabled|list=1|read=2|update=4|create/delete=8',
    `userId` BIGINT DEFAULT 0,
    `groupId` BIGINT DEFAULT 0,
    `updatedAt` INT(11) NOT NULL,
    `createdAt` INT(11) NOT NULL,
    `flags` INT(11) DEFAULT 0,
    `cas` BIGINT(20) UNSIGNED DEFAULT 0,
    `ttl` INT(11) DEFAULT 0,
    PRIMARY KEY (`path`)
);
