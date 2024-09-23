CREATE DATABASE IF NOT EXISTS `tms` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci; 
USE `tms`; 

CREATE TABLE IF NOT EXISTS `accounts` (
`username` VARCHAR(50) NOT NULL,
`password` VARCHAR(255) NOT NULL,
`email` VARCHAR(100) NOT NULL,
`accountStatus` VARCHAR(30) DEFAULT  'active',
CONSTRAINT username_pk PRIMARY KEY (`username`)
) ENGINE = INNODB DEFAULT CHARSET = UTF8;

CREATE TABLE IF NOT EXISTS `UserGroup` (
`username` VARCHAR(50) DEFAULT '',
`user_group` VARCHAR(50) NOT NULL,
CONSTRAINT user_group_pk PRIMARY KEY (`user_group`, `username`)
) ENGINE = INNODB DEFAULT CHARSET = UTF8;

CREATE TABLE IF NOT EXISTS `application` (
    `App_Acronym` VARCHAR(50) NOT NULL,
    `App_Description` TEXT NOT NULL,
    `App_Rnumber`INT NOT NULL,
    `App_startDate` INT NOT NULL,
    `App_endDate` INT NOT NULL,
    `App_permit_Open` VARCHAR(50) NOT NULL,
    `App_permit_toDoList` VARCHAR(50) NOT NULL,
    `App_permit_Doing` VARCHAR(50) NOT NULL,
    `App_permit_Done` VARCHAR(50) NOT NULL,
    `App_permit_Create` VARCHAR(50) NOT NULL,
    CONSTRAINT App_Acronym_pk PRIMARY KEY (`App_Acronym`)
) ENGINE = INNODB DEFAULT CHARSET = UTF8;

CREATE TABLE IF NOT EXISTS `plan` (
    `Plan_MVP_name` VARCHAR(100) NOT NULL,
    `Plan_app_Acronym`VARCHAR(50) NOT NULL,
    `Plan_startDate`INT NOT NULL,
    `Plan_endDate`INT NOT NULL,
    `Plan_colour` VARCHAR(7),
    CONSTRAINT Plan_MVP_name_pk PRIMARY KEY (`Plan_MVP_name`),
    CONSTRAINT Plan_app_Acronym_fk FOREIGN KEY (`Plan_app_Acronym`) REFERENCES application (`App_Acronym`)
) ENGINE = INNODB DEFAULT CHARSET = UTF8;

CREATE TABLE IF NOT EXISTS `task` (
    `Task_id` VARCHAR(55) NOT NULL,
    `Task_plan` VARCHAR(100) DEFAULT '',
    `Task_app_Acronym` VARCHAR(50) NOT NULL,
    `Task_name` VARCHAR(50) NOT NULL,
    `Task_description` TEXT NOT NULL,
    `Task_notes` MEDIUMTEXT NOT NULL,
    `Task_state` VARCHAR(10) NOT NULL,
    `Task_creator`VARCHAR(50) NOT NULL,
    `Task_owner` VARCHAR(50) NOT NULL,
    `Task_createDate` INT NOT NULL,
    CONSTRAINT Task_id_pk PRIMARY KEY (`Task_id`),
    CONSTRAINT Task_plan_fk FOREIGN KEY (`Task_plan`) REFERENCES plan (`Plan_MVP_name`),
    CONSTRAINT Task_app_Acronym_fk FOREIGN KEY (`Task_app_Acronym`) REFERENCES application (`App_Acronym`)
) ENGINE = INNODB DEFAULT CHARSET = UTF8;