import { executeQuery, executeQuerySingle, executeQueryPaginated, PaginatedResult, convertRowToCamelCase, convertObjectToSnakeCase, buildWhereClause, buildOrderByClause } from '../utils/database';
import { CheckIn, CheckInRequest } from '../../shared/types';

export interface CheckInCreateData extends CheckInRequest {}

export interface CheckInUpdateData {
  question1Response?: string;
  question2Response?: boolean;
  question3Response1?: string;
  question3Response2?: string;
  termsAccepted?: boolean;
}

export interface CheckInSearchFilters {
  workerId?: number;
  eventId?: number;
  startDate?: string;
  endDate?: string;
  question1Response?: string;
  question2Response?: boolean;
  termsAccepted?: boolean;
}

export interface CheckInSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'createdAt' | 'workerId' | 'eventId';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CheckInWithDetails extends CheckIn {
  workerName: string;
  workerEmail: string;
  eventName: string;
  eventLocation: string;
}

export class CheckInModel {
  // Create a new check-in
  static async create(data: CheckInCreateData): Promise<CheckIn> {
    const query = `
      INSERT INTO checkins (
        worker_id, event_id, question_1_response, question_2_response,
        question_3_response_1, question_3_response_2, terms_accepted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const params = [
      data.workerId,
      data.eventId,
      data.question1Response,
      data.question2Response,
      data.question3Response1,
      data.question3Response2,
      data.termsAccepted
    ];
    
    const result = await executeQuerySingle<any>(query, params);
    return convertRowToCamelCase<CheckIn>(result);
  }

  // Find check-in by ID
  static async findById(id: number): Promise<CheckIn | null> {
    const query = 'SELECT * FROM checkins WHERE id = $1';
    const result = await executeQuerySingle<any>(query, [id]);
    return result ? convertRowToCamelCase<CheckIn>(result) : null;
  }

  // Find check-in by worker and event (for duplicate prevention)
  static async findByWorkerAndEvent(workerId: number, eventId: number): Promise<CheckIn | null> {
    const query = 'SELECT * FROM checkins WHERE worker_id = $1 AND event_id = $2';
    const result = await executeQuerySingle<any>(query, [workerId, eventId]);
    return result ? convertRowToCamelCase<CheckIn>(result) : null;
  }

  // Get check-ins with worker and event details
  static async findWithDetails(
    filters: CheckInSearchFilters = {},
    options: CheckInSearchOptions = {}
  ): Promise<PaginatedResult<CheckInWithDetails>> {
    const allowedSortColumns = ['timestamp', 'created_at', 'worker_id', 'event_id'];
    const sortColumn = options.sortBy ? convertObjectToSnakeCase({ [options.sortBy]: true }) : 'timestamp';
    const sortOrder = options.sortOrder || 'DESC';

    let baseQuery = `
      SELECT 
        c.*,
        CONCAT(w.first_name, ' ', w.last_name) as worker_name,
        w.email as worker_email,
        e.name as event_name,
        e.location as event_location
      FROM checkins c
      JOIN workers w ON c.worker_id = w.id
      JOIN events e ON c.event_id = e.id
    `;

    let countQuery = `
      SELECT COUNT(*) as count
      FROM checkins c
      JOIN workers w ON c.worker_id = w.id
      JOIN events e ON c.event_id = e.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Build WHERE clause for filters
    if (filters.workerId) {
      conditions.push(`c.worker_id = $${params.length + 1}`);
      params.push(filters.workerId);
    }

    if (filters.eventId) {
      conditions.push(`c.event_id = $${params.length + 1}`);
      params.push(filters.eventId);
    }

    if (filters.startDate) {
      conditions.push(`DATE(c.timestamp) >= $${params.length + 1}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`DATE(c.timestamp) <= $${params.length + 1}`);
      params.push(filters.endDate);
    }

    if (filters.question1Response) {
      conditions.push(`c.question_1_response = $${params.length + 1}`);
      params.push(filters.question1Response);
    }

    if (filters.question2Response !== undefined) {
      conditions.push(`c.question_2_response = $${params.length + 1}`);
      params.push(filters.question2Response);
    }

    if (filters.termsAccepted !== undefined) {
      conditions.push(`c.terms_accepted = $${params.length + 1}`);
      params.push(filters.termsAccepted);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    // Add sorting
    const orderBy = buildOrderByClause(
      `c.${Object.keys(sortColumn)[0]}`,
      sortOrder,
      allowedSortColumns.map(col => `c.${col}`)
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
      data: result.data.map(row => convertRowToCamelCase<CheckInWithDetails>(row))
    };
  }

  // Get all check-ins with basic pagination
  static async findAll(
    filters: CheckInSearchFilters = {},
    options: CheckInSearchOptions = {}
  ): Promise<PaginatedResult<CheckIn>> {
    const allowedSortColumns = ['timestamp', 'created_at', 'worker_id', 'event_id'];
    const sortColumn = options.sortBy ? convertObjectToSnakeCase({ [options.sortBy]: true }) : 'timestamp';
    const sortOrder = options.sortOrder || 'DESC';

    let baseQuery = 'SELECT * FROM checkins';
    let countQuery = 'SELECT COUNT(*) as count FROM checkins';
    const params: any[] = [];

    // Build WHERE clause for filters
    const additionalFilters: Record<string, any> = {};
    if (filters.workerId) additionalFilters.workerId = filters.workerId;
    if (filters.eventId) additionalFilters.eventId = filters.eventId;
    if (filters.question1Response) additionalFilters.question1Response = filters.question1Response;
    if (filters.question2Response !== undefined) additionalFilters.question2Response = filters.question2Response;
    if (filters.termsAccepted !== undefined) additionalFilters.termsAccepted = filters.termsAccepted;

    const conditions: string[] = [];

    if (filters.startDate) {
      conditions.push(`DATE(timestamp) >= $${params.length + 1}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`DATE(timestamp) <= $${params.length + 1}`);
      params.push(filters.endDate);
    }

    if (Object.keys(additionalFilters).length > 0) {
      const { whereClause, params: filterParams } = buildWhereClause(
        convertObjectToSnakeCase(additionalFilters),
        params.length + 1
      );
      
      if (whereClause) {
        conditions.push(whereClause.replace('WHERE ', ''));
        params.push(...filterParams);
      }
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      baseQuery += whereClause;
      countQuery += whereClause;
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
      data: result.data.map(row => convertRowToCamelCase<CheckIn>(row))
    };
  }

  // Update check-in
  static async update(id: number, data: CheckInUpdateData): Promise<CheckIn | null> {
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
      UPDATE checkins 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuerySingle<any>(query, params);
    return result ? convertRowToCamelCase<CheckIn>(result) : null;
  }

  // Delete check-in
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM checkins WHERE id = $1';
    const result = await executeQuery(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Get check-ins for a specific event
  static async getByEvent(eventId: number, options: CheckInSearchOptions = {}): Promise<PaginatedResult<CheckInWithDetails>> {
    return this.findWithDetails({ eventId }, options);
  }

  // Get check-ins for a specific worker
  static async getByWorker(workerId: number, options: CheckInSearchOptions = {}): Promise<PaginatedResult<CheckInWithDetails>> {
    return this.findWithDetails({ workerId }, options);
  }

  // Get today's check-ins
  static async getTodaysCheckIns(eventId?: number): Promise<CheckIn[]> {
    let query = `
      SELECT * FROM checkins 
      WHERE DATE(timestamp) = CURRENT_DATE
    `;
    const params: any[] = [];

    if (eventId) {
      query += ' AND event_id = $1';
      params.push(eventId);
    }

    query += ' ORDER BY timestamp DESC';

    const result = await executeQuery<any>(query, params);
    return result.rows.map(row => convertRowToCamelCase<CheckIn>(row));
  }

  // Get check-in statistics
  static async getStats(eventId?: number): Promise<{
    totalCheckIns: number;
    todayCheckIns: number;
    thisWeekCheckIns: number;
    thisMonthCheckIns: number;
  }> {
    let query = `
      SELECT 
        COUNT(*) as total_checkins,
        COUNT(CASE WHEN DATE(timestamp) = CURRENT_DATE THEN 1 END) as today_checkins,
        COUNT(CASE WHEN timestamp >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as week_checkins,
        COUNT(CASE WHEN timestamp >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month_checkins
      FROM checkins
    `;

    const params: any[] = [];

    if (eventId) {
      query += ' WHERE event_id = $1';
      params.push(eventId);
    }

    const result = await executeQuerySingle<any>(query, params);
    
    return {
      totalCheckIns: parseInt(result?.total_checkins || '0'),
      todayCheckIns: parseInt(result?.today_checkins || '0'),
      thisWeekCheckIns: parseInt(result?.week_checkins || '0'),
      thisMonthCheckIns: parseInt(result?.month_checkins || '0')
    };
  }

  // Get check-in analytics by question responses
  static async getAnalytics(eventId?: number): Promise<{
    question1Responses: Record<string, number>;
    question2Responses: { yes: number; no: number };
    question3Response1: Record<string, number>;
    question3Response2: Record<string, number>;
  }> {
    let baseQuery = 'FROM checkins';
    const params: any[] = [];

    if (eventId) {
      baseQuery += ' WHERE event_id = $1';
      params.push(eventId);
    }

    // Get question 1 responses
    const q1Query = `
      SELECT question_1_response, COUNT(*) as count 
      ${baseQuery} 
      GROUP BY question_1_response 
      ORDER BY count DESC
    `;

    // Get question 2 responses
    const q2Query = `
      SELECT question_2_response, COUNT(*) as count 
      ${baseQuery} 
      GROUP BY question_2_response
    `;

    // Get question 3 part 1 responses
    const q3p1Query = `
      SELECT question_3_response_1, COUNT(*) as count 
      ${baseQuery} 
      GROUP BY question_3_response_1 
      ORDER BY count DESC
    `;

    // Get question 3 part 2 responses
    const q3p2Query = `
      SELECT question_3_response_2, COUNT(*) as count 
      ${baseQuery} 
      GROUP BY question_3_response_2 
      ORDER BY count DESC
    `;

    const [q1Result, q2Result, q3p1Result, q3p2Result] = await Promise.all([
      executeQuery<any>(q1Query, params),
      executeQuery<any>(q2Query, params),
      executeQuery<any>(q3p1Query, params),
      executeQuery<any>(q3p2Query, params)
    ]);

    // Process results
    const question1Responses: Record<string, number> = {};
    q1Result.rows.forEach(row => {
      question1Responses[row.question_1_response] = parseInt(row.count);
    });

    const question2Responses = { yes: 0, no: 0 };
    q2Result.rows.forEach(row => {
      if (row.question_2_response) {
        question2Responses.yes = parseInt(row.count);
      } else {
        question2Responses.no = parseInt(row.count);
      }
    });

    const question3Response1: Record<string, number> = {};
    q3p1Result.rows.forEach(row => {
      question3Response1[row.question_3_response_1] = parseInt(row.count);
    });

    const question3Response2: Record<string, number> = {};
    q3p2Result.rows.forEach(row => {
      question3Response2[row.question_3_response_2] = parseInt(row.count);
    });

    return {
      question1Responses,
      question2Responses,
      question3Response1,
      question3Response2
    };
  }

  // Check if worker has already checked in for event
  static async hasWorkerCheckedIn(workerId: number, eventId: number): Promise<boolean> {
    const result = await this.findByWorkerAndEvent(workerId, eventId);
    return result !== null;
  }

  // Get recent check-ins for dashboard
  static async getRecentCheckIns(limit: number = 10, eventId?: number): Promise<CheckInWithDetails[]> {
    const result = await this.findWithDetails(
      eventId ? { eventId } : {},
      { limit, sortBy: 'timestamp', sortOrder: 'DESC' }
    );
    return result.data;
  }
}