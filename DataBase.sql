-- create database hotelier;
-- create table users(
--     id serial primary key,
--     Full_Name varchar(255) not null,
--     email varchar(255) not null unique,
--     phone varchar(20)  null,
--     Address varchar(255) null,
--     password varchar(255) not null,
--     role varchar(50) not null default 'user',
--     created_at timestamp default now(),
--     updated_at timestamp default now()
-- );

-- SELECT current_database();
-- drop table users;

-- select * from users;

CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	full_name VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	phone VARCHAR(20),
	address VARCHAR(255),
	password VARCHAR(255) NOT NULL,
	role VARCHAR(50) NOT NULL DEFAULT 'user',
	created_at TIMESTAMP DEFAULT NOW(),
	updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
	id SERIAL PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	price_per_night NUMERIC(10, 2) NOT NULL,
	beds INT DEFAULT 1,
	bathrooms INT DEFAULT 1,
	capacity INT DEFAULT 2,
	image_url TEXT,
	description TEXT,
	created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
	id SERIAL PRIMARY KEY,
	room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
	check_in DATE NOT NULL,
	check_out DATE NOT NULL,
	guests INT NOT NULL,
	total_price NUMERIC(10, 2) NOT NULL,
	special_requests TEXT,
	guest_name VARCHAR(150) NOT NULL,
	guest_email VARCHAR(255) NOT NULL,
	guest_phone VARCHAR(20) NOT NULL,
	status VARCHAR(30) DEFAULT 'pending',
	created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
	id SERIAL PRIMARY KEY,
	room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
	guest_name VARCHAR(150),
	rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
	comment TEXT,
	created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
	id SERIAL PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	email VARCHAR(255) NOT NULL,
	subject VARCHAR(255) NOT NULL,
	message TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT NOW()
);

-- select * from contacts;

-- select * from bookings;
-- select * from reviews;