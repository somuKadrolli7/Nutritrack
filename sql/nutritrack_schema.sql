CREATE DATABASE IF NOT EXISTS nutritrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nutritrack;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200),
  email VARCHAR(200) UNIQUE,
  password VARCHAR(255),
  age INT,
  weight FLOAT,
  height FLOAT,
  gender VARCHAR(10),
  activity FLOAT DEFAULT 1.2,
  goal VARCHAR(20) DEFAULT 'maintenance',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional tables to create later:
-- food (id,name,category,calories,protein,carbs,fats,vitamins,json_meta),
-- exercises (id,name,desc,calories_est,image),
-- plans (id,user_id,day,json_meals,created_at)
