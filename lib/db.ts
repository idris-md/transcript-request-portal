// lib/db.ts
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

export const eportalPool = mysql.createPool({
  host: process.env.EPORTAL_DB_HOST!,
  user: process.env.EPORTAL_DB_USER!,
  password: process.env.EPORTAL_DB_PASS!,
  database: process.env.EPORTAL_DB_NAME!,
  connectionLimit: 10,
});

export const transcriptPool = mysql.createPool({
  host: process.env.TRANSCRIPT_DB_HOST!,
  user: process.env.TRANSCRIPT_DB_USER!,
  password: process.env.TRANSCRIPT_DB_PASS!,
  database: process.env.TRANSCRIPT_DB_NAME!,
  connectionLimit: 10,
});

export const eportalDb = drizzle(eportalPool);
export const transcriptDb = drizzle(transcriptPool);
