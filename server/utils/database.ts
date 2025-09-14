import { Pool, PoolClient, QueryResult } from 'pg';
import { pool } from '../config/database';

export interface QueryOptions {
  client?: PoolClient;
  timeout?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Generic query executor with error handling
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = [],
  options: QueryOptions = {}
): Promise<QueryResult<T>> => {
  const client = options.client || pool;
  
  try {
    const result = await client.query<T>(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', {
      query: query.substring(0, 100) + '...',
      params,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
};

// Execute query and return first row or null
export const executeQuerySingle = async <T = any>(
  query: string,
  params: any[] = [],
  options: QueryOptions = {}
): Promise<T | null> => {
  const result = await executeQuery<T>(query, params, options);
  return result.rows[0] || null;
};

// Execute query with pagination
export const executeQueryPaginated = async <T = any>(
  baseQuery: string,
  countQuery: string,
  params: any[] = [],
  paginationOptions: PaginationOptions = {}
): Promise<PaginatedResult<T>> => {
  const page = paginationOptions.page || 1;
  const limit = paginationOptions.limit || 20;
  const offset = paginationOptions.offset || (page - 1) * limit;

  // Get total count
  const countResult = await executeQuery<{ count: string }>(countQuery, params);
  const total = parseInt(countResult.rows[0]?.count || '0');

  // Get paginated data
  const paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await executeQuery<T>(paginatedQuery, [...params, limit, offset]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

// Transaction wrapper
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Build WHERE clause from filters
export const buildWhereClause = (
  filters: Record<string, any>,
  startParamIndex: number = 1
): { whereClause: string; params: any[]; nextParamIndex: number } => {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = startParamIndex;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // Handle IN clauses
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'string' && value.includes('%')) {
        // Handle LIKE clauses
        conditions.push(`${key} ILIKE $${paramIndex++}`);
        params.push(value);
      } else {
        // Handle equality
        conditions.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    }
  });

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  return {
    whereClause,
    params,
    nextParamIndex: paramIndex
  };
};

// Build ORDER BY clause
export const buildOrderByClause = (
  sortBy?: string,
  sortOrder: 'ASC' | 'DESC' = 'ASC',
  allowedColumns: string[] = []
): string => {
  if (!sortBy || !allowedColumns.includes(sortBy)) {
    return '';
  }
  
  return `ORDER BY ${sortBy} ${sortOrder}`;
};

// Escape and validate column names for dynamic queries
export const validateColumnName = (columnName: string, allowedColumns: string[]): string => {
  if (!allowedColumns.includes(columnName)) {
    throw new Error(`Invalid column name: ${columnName}`);
  }
  return columnName;
};

// Convert camelCase to snake_case for database columns
export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Convert snake_case to camelCase for JavaScript objects
export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Convert database row to camelCase object
export const convertRowToCamelCase = <T = any>(row: any): T => {
  if (!row) return row;
  
  const converted: any = {};
  Object.keys(row).forEach(key => {
    converted[toCamelCase(key)] = row[key];
  });
  
  return converted as T;
};

// Convert camelCase object to snake_case for database
export const convertObjectToSnakeCase = (obj: any): any => {
  if (!obj) return obj;
  
  const converted: any = {};
  Object.keys(obj).forEach(key => {
    converted[toSnakeCase(key)] = obj[key];
  });
  
  return converted;
};