import { executeQuery, executeQuerySingle, executeQueryPaginated, PaginatedResult, convertRowToCamelCase, convertObjectToSnakeCase, buildWhereClause, buildOrderByClause } from '../utils/database';
import { Worker } from '../../shared/types';

export interface WorkerCreateData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface WorkerUpdateData extends Partial<WorkerCreateData> {}

export interface WorkerSearchFilters {
  search?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface WorkerSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export class WorkerModel {
  // Create a new worker
  static async create(data: WorkerCreateData): Promise<Worker> {
    const query = `
      INSERT INTO workers (
        first_name, last_name, date_of_birth, email, phone,
        street_address, city, state, zip_code, country
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const params = [
      data.firstName,
      data.lastName,
      data.dateOfBirth,
      data.email,
      data.phone,
      data.streetAddress,
      data.city,
      data.state,
      data.zipCode,
      data.country
    ];
    
    const result = await executeQuerySingle<any>(query, params);
    return convertRowToCamelCase<Worker>(result);
  }

  // Find worker by ID
  static async findById(id: number): Promise<Worker | null> {
    const query = 'SELECT * FROM workers WHERE id = $1';
    const result = await executeQuerySingle<any>(query, [id]);
    return result ? convertRowToCamelCase<Worker>(result) : null;
  }

  // Find worker by email
  static async findByEmail(email: string): Promise<Worker | null> {
    const query = 'SELECT * FROM workers WHERE email = $1';
    const result = await executeQuerySingle<any>(query, [email]);
    return result ? convertRowToCamelCase<Worker>(result) : null;
  }

  // Find worker by phone
  static async findByPhone(phone: string): Promise<Worker | null> {
    const query = 'SELECT * FROM workers WHERE phone = $1';
    const result = await executeQuerySingle<any>(query, [phone]);
    return result ? convertRowToCamelCase<Worker>(result) : null;
  }

  // Search workers with real-time search functionality
  static async search(searchTerm: string, limit: number = 10): Promise<Worker[]> {
    if (searchTerm.length < 3) {
      return [];
    }

    const query = `
      SELECT id, first_name, last_name, email, phone
      FROM workers 
      WHERE 
        LOWER(first_name) LIKE LOWER($1) OR 
        LOWER(last_name) LIKE LOWER($1) OR 
        LOWER(email) LIKE LOWER($1) OR
        LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER($1)
      ORDER BY 
        CASE 
          WHEN LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER($2) THEN 1
          WHEN LOWER(first_name) LIKE LOWER($2) THEN 2
          WHEN LOWER(last_name) LIKE LOWER($2) THEN 3
          ELSE 4
        END,
        first_name, last_name
      LIMIT $3
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const exactPattern = `${searchTerm}%`;
    const result = await executeQuery<any>(query, [searchPattern, exactPattern, limit]);
    
    return result.rows.map(row => convertRowToCamelCase<Worker>(row));
  }

  // Get all workers with pagination and filtering
  static async findAll(
    filters: WorkerSearchFilters = {},
    options: WorkerSearchOptions = {}
  ): Promise<PaginatedResult<Worker>> {
    const allowedSortColumns = ['first_name', 'last_name', 'email', 'created_at'];
    const sortColumn = options.sortBy ? convertObjectToSnakeCase({ [options.sortBy]: true }) : 'created_at';
    const sortOrder = options.sortOrder || 'DESC';

    let baseQuery = 'SELECT * FROM workers';
    let countQuery = 'SELECT COUNT(*) as count FROM workers';
    const params: any[] = [];

    // Build WHERE clause for filters
    if (filters.search) {
      const searchCondition = `
        (LOWER(first_name) LIKE LOWER($${params.length + 1}) OR 
         LOWER(last_name) LIKE LOWER($${params.length + 1}) OR 
         LOWER(email) LIKE LOWER($${params.length + 1}) OR
         LOWER(CONCAT(first_name, ' ', last_name)) LIKE LOWER($${params.length + 1}))
      `;
      baseQuery += ` WHERE ${searchCondition}`;
      countQuery += ` WHERE ${searchCondition}`;
      params.push(`%${filters.search}%`);
    }

    // Add additional filters
    const additionalFilters: Record<string, any> = {};
    if (filters.email) additionalFilters.email = filters.email;
    if (filters.phone) additionalFilters.phone = filters.phone;
    if (filters.city) additionalFilters.city = filters.city;
    if (filters.state) additionalFilters.state = filters.state;

    if (Object.keys(additionalFilters).length > 0) {
      const { whereClause, params: filterParams } = buildWhereClause(
        convertObjectToSnakeCase(additionalFilters),
        params.length + 1
      );
      
      const connector = params.length > 0 ? ' AND ' : ' WHERE ';
      baseQuery += connector + whereClause.replace('WHERE ', '');
      countQuery += connector + whereClause.replace('WHERE ', '');
      params.push(...filterParams);
    }

    // Add sorting
    const orderBy = buildOrderByClause(
      Object.keys(sortColumn)[0],
      sortOrder,
      allowedSortColumns
    );
    if (orderBy) {
      baseQuery += ` ${orderBy}`;
    }

    const result = await executeQueryPaginated<any>(
      baseQuery,
      countQuery,
      params,
      {
        page: options.page,
        limit: options.limit
      }
    );

    return {
      ...result,
      data: result.data.map(row => convertRowToCamelCase<Worker>(row))
    };
  }

  // Update worker
  static async update(id: number, data: WorkerUpdateData): Promise<Worker | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbColumn = convertObjectToSnakeCase({ [key]: value });
        const columnName = Object.keys(dbColumn)[0];
        updates.push(`${columnName} = $${paramIndex++}`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    params.push(id); // Add ID as last parameter

    const query = `
      UPDATE workers 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuerySingle<any>(query, params);
    return result ? convertRowToCamelCase<Worker>(result) : null;
  }

  // Delete worker
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM workers WHERE id = $1';
    const result = await executeQuery(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Check if email exists (for validation)
  static async emailExists(email: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT 1 FROM workers WHERE email = $1';
    const params: any[] = [email];

    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await executeQuerySingle(query, params);
    return result !== null;
  }

  // Check if phone exists (for validation)
  static async phoneExists(phone: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT 1 FROM workers WHERE phone = $1';
    const params: any[] = [phone];

    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await executeQuerySingle(query, params);
    return result !== null;
  }

  // Get worker statistics
  static async getStats(): Promise<{
    totalWorkers: number;
    newWorkersThisMonth: number;
    newWorkersToday: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_workers,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_this_month,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as new_today
      FROM workers
    `;

    const result = await executeQuerySingle<any>(query);
    
    return {
      totalWorkers: parseInt(result?.total_workers || '0'),
      newWorkersThisMonth: parseInt(result?.new_this_month || '0'),
      newWorkersToday: parseInt(result?.new_today || '0')
    };
  }
}