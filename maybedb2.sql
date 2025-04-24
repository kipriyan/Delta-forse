-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema job
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema job
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `job` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `job` ;

-- -----------------------------------------------------
-- Table `job`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(50) NULL DEFAULT NULL,
  `last_name` VARCHAR(50) NULL DEFAULT NULL,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `user_type` ENUM('person', 'company', 'admin') NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username` (`username` ASC) VISIBLE,
  UNIQUE INDEX `email` (`email` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 17
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `job`.`companies`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`companies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `company_name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `industry` VARCHAR(50) NULL DEFAULT NULL,
  `company_size` VARCHAR(50) NULL DEFAULT NULL,
  `website` VARCHAR(255) NULL DEFAULT NULL,
  `logo_url` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  CONSTRAINT `companies_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `job`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `job`.`equipment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`equipment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `location` VARCHAR(100) NULL DEFAULT NULL,
  `category` VARCHAR(50) NULL DEFAULT NULL,
  `status` ENUM('available', 'rented', 'maintenance') NULL DEFAULT 'available',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `idx_equipment_status` (`status` ASC) VISIBLE,
  CONSTRAINT `equipment_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `job`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 11
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `job`.`equipment_images`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`equipment_images` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `equipment_id` INT NULL DEFAULT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `is_primary` TINYINT(1) NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  INDEX `equipment_id` (`equipment_id` ASC) VISIBLE,
  CONSTRAINT `equipment_images_ibfk_1`
    FOREIGN KEY (`equipment_id`)
    REFERENCES `job`.`equipment` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `job`.`equipment_specifications`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`equipment_specifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `equipment_id` INT NULL DEFAULT NULL,
  `spec_key` VARCHAR(50) NOT NULL,
  `spec_value` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `equipment_id` (`equipment_id` ASC) VISIBLE,
  CONSTRAINT `equipment_specifications_ibfk_1`
    FOREIGN KEY (`equipment_id`)
    REFERENCES `job`.`equipment` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `job`.`job_listings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`job_listings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `company_id` INT NULL DEFAULT NULL,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `requirements` TEXT NULL DEFAULT NULL,
  `benefits` TEXT NULL DEFAULT NULL,
  `location` VARCHAR(100) NULL DEFAULT NULL,
  `salary` VARCHAR(50) NULL DEFAULT NULL,
  `job_type` ENUM('full-time', 'part-time', 'contract', 'temporary') NULL DEFAULT NULL,
  `category` VARCHAR(50) NULL DEFAULT NULL,
  `industry` VARCHAR(50) NULL DEFAULT NULL,
  `status` ENUM('active', 'closed', 'draft') NULL DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `company_id` (`company_id` ASC) VISIBLE,
  INDEX `idx_job_listings_status` (`status` ASC) VISIBLE,
  CONSTRAINT `job_listings_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `job`.`users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `job_listings_ibfk_2`
    FOREIGN KEY (`company_id`)
    REFERENCES `job`.`companies` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 21
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `job`.`job_applications`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`job_applications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `job_id` INT NULL DEFAULT NULL,
  `user_id` INT NULL DEFAULT NULL,
  `cover_letter` TEXT NULL DEFAULT NULL,
  `cv_url` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('pending', 'reviewed', 'approved', 'rejected') NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `resume_url` VARCHAR(255) NULL DEFAULT NULL,
  `resume_file` VARCHAR(255) NULL DEFAULT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `job_id` (`job_id` ASC) VISIBLE,
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `idx_job_applications_status` (`status` ASC) VISIBLE,
  CONSTRAINT `job_applications_ibfk_1`
    FOREIGN KEY (`job_id`)
    REFERENCES `job`.`job_listings` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `job_applications_ibfk_2`
    FOREIGN KEY (`user_id`)
    REFERENCES `job`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 31
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `job`.`rental_requests`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`rental_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `equipment_id` INT NULL DEFAULT NULL,
  `user_id` INT NULL DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `message` TEXT NULL DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NULL DEFAULT 'pending',
  `total_price` DECIMAL(10,2) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `equipment_id` (`equipment_id` ASC) VISIBLE,
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `idx_rental_requests_status` (`status` ASC) VISIBLE,
  CONSTRAINT `rental_requests_ibfk_1`
    FOREIGN KEY (`equipment_id`)
    REFERENCES `job`.`equipment` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `rental_requests_ibfk_2`
    FOREIGN KEY (`user_id`)
    REFERENCES `job`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `job`.`saved_equipment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`saved_equipment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `equipment_id` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `equipment_id` (`equipment_id` ASC) VISIBLE,
  CONSTRAINT `saved_equipment_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `job`.`users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `saved_equipment_ibfk_2`
    FOREIGN KEY (`equipment_id`)
    REFERENCES `job`.`equipment` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `job`.`saved_jobs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `job`.`saved_jobs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL DEFAULT NULL,
  `job_id` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC) VISIBLE,
  INDEX `job_id` (`job_id` ASC) VISIBLE,
  CONSTRAINT `saved_jobs_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `job`.`users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `saved_jobs_ibfk_2`
    FOREIGN KEY (`job_id`)
    REFERENCES `job`.`job_listings` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
