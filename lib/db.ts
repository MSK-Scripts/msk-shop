import mysql from 'mysql2/promise';

// Singleton pool — reused across all API route invocations in the same process.
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:               process.env.DB_HOST     ?? 'localhost',
      port:               Number(process.env.DB_PORT ?? 3306),
      user:               process.env.DB_USER     ?? '',
      password:           process.env.DB_PASSWORD ?? '',
      database:           process.env.DB_NAME     ?? '',
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
      timezone:           '+00:00',
    });
  }
  return pool;
}

// Convenience wrapper – executes a parameterised query and returns rows.
export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params as mysql.QueryValues[]);
  return rows as T[];
}

// Convenience wrapper for single-row lookups.
export async function queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
