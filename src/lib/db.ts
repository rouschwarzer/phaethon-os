import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

/**
 * Helper to get the database instance.
 * Maintains compatibility with existing code that calls getDb().
 */
export function getDb() {
    return db;
}
