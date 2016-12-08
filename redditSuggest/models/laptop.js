const db = require('../db');



db.query(`CREATE TABLE IF NOT EXISTS laptop_models (
  model varchar(255) NOT NULL,
  mentions integer DEFAULT 1,
  price numeric(10, 2),
  url text,
  brand varchar(100),
  release_date date,
  screen_size varchar(10),


  );`);

db.query(`CREATE TABLE IF NOT EXISTS mentions (
  model varchar(255) NOT NULL,
  create_date date,
  url text,
  subreddit text,
  subreddit varchar(255),

  );`);

