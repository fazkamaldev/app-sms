CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS app_db;

USE auth_db;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);

-- admin user is seeded by bff-auth on startup

USE app_db;

CREATE TABLE settings (
  `key` VARCHAR(255) PRIMARY KEY,
  `value` TEXT NOT NULL
);

INSERT INTO settings (`key`, `value`) VALUES ('app_name', 'My App');
