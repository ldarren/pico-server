-- Usage: mysql -uUID -pPWD -h HOST -e "set @db_name=DB_NAME; source SRC_PATH;" > LOG_PATH

-- Concept: uses 4 tables to create a 3 level deep json structure, last level is real json
-- data = {
--          map.k: map.json
--          list.type & list.k: [list.json]
--          ref.type & ref.refId: {ref.k: ref.json}
--        }

DROP DATABASE IF EXISTS `@db_name`;
CREATE DATABASE IF NOT EXISTS `@db_name` DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci;

USE `@db_name`;

SET storage_engine=INNODB;

-- 
CREATE TABLE IF NOT EXISTS `data`(
    `id` SERIAL PRIMARY KEY,
    `type` INT UNSIGNED DEFAULT 0,
    `status` TINYINT UNSIGNED DEFAULT 1,
    `updatedBy` BIGINT UNSIGNED,
    `updatedAt` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `createdBy` BIGINT UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY (`type`),
    KEY (`updatedAt`)
);

-- json:NULL === status=0
CREATE TABLE `map`(
    `id` SERIAL PRIMARY KEY,
    `dataId` BIGINT UNSIGNED NOT NULL,
    `k` INT NOT NULL,
    `json` TEXT,
    `status` TINYINT UNSIGNED DEFAULT 1,
    `updatedBy` BIGINT UNSIGNED,
    `updatedAt` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `createdBy` BIGINT UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (`dataId`, `k`),
    KEY (`k`)
);

--
CREATE TABLE `list`(
    `id` SERIAL PRIMARY KEY,
    `dataId` BIGINT UNSIGNED NOT NULL,
    `k` INT NOT NULL,
    `json` TEXT NOT NULL,
    `status` TINYINT UNSIGNED DEFAULT 1,
    `updatedBy` BIGINT UNSIGNED,
    `updatedAt` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `createdBy` BIGINT UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY (`dataId`),
    KEY (`k`)
);

-- 
CREATE TABLE `ref`(
    `id` SERIAL PRIMARY KEY,
    `dataId` BIGINT UNSIGNED NOT NULL,
    `type` INT UNSIGNED DEFAULT 0,
    `refId` BIGINT UNSIGNED NOT NULL,
    `k` BIGINT UNSIGNED,
    `json` TEXT,
    `status` TINYINT UNSIGNED DEFAULT 1,
    `updatedBy` BIGINT UNSIGNED,
    `updatedAt` TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `createdBy` BIGINT UNSIGNED NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (`dataId`, `refId`, `k`),
    KEY (`refId`)
);

CREATE TABLE `hash`(
    `id` SERIAL PRIMARY KEY,
    `k` TEXT NOT NULL,
    `status` TINYINT UNSIGNED DEFAULT 1,
    UNIQUE KEY (`k`)
);
