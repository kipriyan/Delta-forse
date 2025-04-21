-- Създаване на базата данни
CREATE DATABASE job;
USE job;

-- Таблица за потребители
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    user_type ENUM('person', 'company', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица за компании
CREATE TABLE companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    company_name VARCHAR(100) NOT NULL,
    description TEXT,
    industry VARCHAR(50),
    company_size VARCHAR(50),
    website VARCHAR(255),
    logo_url VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица за работни обяви
CREATE TABLE job_listings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    company_id INT,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    location VARCHAR(100),
    salary VARCHAR(50),
    job_type ENUM('full-time', 'part-time', 'contract', 'temporary'),
    category VARCHAR(50),
    industry VARCHAR(50),
    status ENUM('active', 'closed', 'draft') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Таблица за кандидатури за работа
CREATE TABLE job_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_id INT,
    user_id INT,
    cover_letter TEXT,
    cv_url VARCHAR(255),
    status ENUM('pending', 'reviewed', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица за оборудване
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    location VARCHAR(100),
    category VARCHAR(50),
    status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица за спецификации на оборудване
CREATE TABLE equipment_specifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT,
    spec_key VARCHAR(50) NOT NULL,
    spec_value VARCHAR(255) NOT NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Таблица за заявки за наемане на оборудване
CREATE TABLE rental_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT,
    user_id INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    message TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица за запазени обяви
CREATE TABLE saved_jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    job_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE
);

-- Таблица за запазено оборудване
CREATE TABLE saved_equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    equipment_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Индекси за оптимизация на търсенето
CREATE INDEX idx_job_listings_status ON job_listings(status);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_rental_requests_status ON rental_requests(status);
CREATE INDEX idx_job_applications_status ON job_applications(status);