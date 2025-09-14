import { executeQuery, executeQuerySingle, executeQueryPaginated, PaginatedResult, convertRowToCamelCase, convertObjectToSnakeCase, buildWhereClause, buildOrderByClause } from '../utils/database';
import { Event } from '../../shared/types';

export interface EventCreateData {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  isActive?: boolean;
}

export interface EventUpdateData extends Partial<EventCreateData> {}

export interface EventSearchFilters {
  search?: string;
  location?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface EventSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'startDate' | 'endDate' | 'location' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export class EventModel {
  // Create a new event
  static async create(data: EventCreateData): Promise<Event> {
    const query = `
      INSERT INTO events (name, start_date, end_date, location, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const params = [
      data.name,
      data.startDate,
      data.endDate,
      data.location,
      data.isActive || false
    ];
    
    const result = await executeQuerySingle<any>(query, params);
    return convertRowToCamelCase<Event>(result);
  }

  // Find event by ID
  static async findById(id: number): Promise<Event | null> {
    const query = 'SELECT * FROM events WHERE id = $1';
    const result = await executeQuerySingle<any>(query, [id]);
    return result ? convertRowToCamelCase<Event>(result) : null;
  }

  // Get currently active event
  static async getActiveEvent(): Promise<Event | null> {
    // First check for manually set active event
    let query = 'SELECT * FROM events WHERE is_active = true ORDER BY updated_at DESC LIMIT 1';
    let result = await executeQuerySingle<any>(query);
    
    if (result) {
      return convertRowToCamelCase<Event>(result);
    }

    // If no manually active event, find event where current date is within range
    query = `
      SELECT * FROM events 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY start_date ASC 
      LIMIT 1
    `;
    
    result = await executeQuerySingle<any>(query);
    return result ? convertRowToCamelCase<Event>(result) : null;
  }

  // Get all events with pagination and filtering
  static async findAll(
    filters: EventSearchFilters = {},
    options: EventSearchOptions = {}
  ): Promise<PaginatedResult<Event>> {
    const allowedSortColumns = ['name', 'start_date', 'end_date', 'location', 'created_at'];
    const sortColumn = options.sortBy ? convertObjectToSnakeCase({ [options.sortBy]: true }) : 'start_date';
    const sortOrder = options.sortOrder || 'DESC';

    let baseQuery = 'SELECT * FROM events';
    let countQuery = 'SELECT COUNT(*) as count FROM events';
    const params: any[] = [];

    // Build WHERE clause for filters
    const conditions: string[] = [];

    if (filters.search) {
      conditions.push(`(LOWER(name) LIKE LOWER($${params.length + 1}) OR LOWER(location) LIKE LOWER($${params.length + 1}))`);
      params.push(`%${filters.search}%`);
    }

    if (filters.location) {
      conditions.push(`LOWER(location) LIKE LOWER($${params.length + 1})`);
      params.push(`%${filters.location}%`);
    }

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${params.length + 1}`);
      params.push(filters.isActive);
    }

    if (filters.startDate) {
      conditions.push(`start_date >= $${params.length + 1}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`end_date <= $${params.length + 1}`);
      params.push(filters.endDate);
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
      data: result.data.map(row => convertRowToCamelCase<Event>(row))
    };
  }

  // Update event
  static async update(id: number, data: EventUpdateData): Promise<Event | null> {
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
      UPDATE events 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuerySingle<any>(query, params);
    return result ? convertRowToCamelCase<Event>(result) : null;
  }

  // Set event as active (and deactivate others)
  static async setActive(id: number): Promise<Event | null> {
    // Use transaction to ensure only one active event
    const query1 = 'UPDATE events SET is_active = false WHERE is_active = true';
    const query2 = 'UPDATE events SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';

    await executeQuery(query1);
    const result = await executeQuerySingle<any>(query2, [id]);
    
    return result ? convertRowToCamelCase<Event>(result) : null;
  }

  // Deactivate all events
  static async deactivateAll(): Promise<void> {
    const query = 'UPDATE events SET is_active = false, updated_at = CURRENT_TIMESTAMP';
    await executeQuery(query);
  }

  // Delete event
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM events WHERE id = $1';
    const result = await executeQuery(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Bulk create events from JSON import
  static async bulkCreate(events: EventCreateData[]): Promise<Event[]> {
    if (events.length === 0) {
      return [];
    }

    const values: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    events.forEach(event => {
      values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      params.push(
        event.name,
        event.startDate,
        event.endDate,
        event.location,
        event.isActive || false
      );
    });

    const query = `
      INSERT INTO events (name, start_date, end_date, location, is_active)
      VALUES ${values.join(', ')}
      RETURNING *
    `;

    const result = await executeQuery<any>(query, params);
    return result.rows.map(row => convertRowToCamelCase<Event>(row));
  }

  // Get events that are currently in date range (for auto-activation)
  static async getCurrentEvents(): Promise<Event[]> {
    const query = `
      SELECT * FROM events 
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY start_date ASC
    `;
    
    const result = await executeQuery<any>(query);
    return result.rows.map(row => convertRowToCamelCase<Event>(row));
  }

  // Get upcoming events
  static async getUpcomingEvents(limit: number = 5): Promise<Event[]> {
    const query = `
      SELECT * FROM events 
      WHERE start_date > CURRENT_DATE
      ORDER BY start_date ASC
      LIMIT $1
    `;
    
    const result = await executeQuery<any>(query, [limit]);
    return result.rows.map(row => convertRowToCamelCase<Event>(row));
  }

  // Get past events
  static async getPastEvents(limit: number = 5): Promise<Event[]> {
    const query = `
      SELECT * FROM events 
      WHERE end_date < CURRENT_DATE
      ORDER BY end_date DESC
      LIMIT $1
    `;
    
    const result = await executeQuery<any>(query, [limit]);
    return result.rows.map(row => convertRowToCamelCase<Event>(row));
  }

  // Get event statistics
  static async getStats(): Promise<{
    totalEvents: number;
    activeEvents: number;
    upcomingEvents: number;
    pastEvents: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_events,
        COUNT(CASE WHEN start_date > CURRENT_DATE THEN 1 END) as upcoming_events,
        COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END) as past_events
      FROM events
    `;

    const result = await executeQuerySingle<any>(query);
    
    return {
      totalEvents: parseInt(result?.total_events || '0'),
      activeEvents: parseInt(result?.active_events || '0'),
      upcomingEvents: parseInt(result?.upcoming_events || '0'),
      pastEvents: parseInt(result?.past_events || '0')
    };
  }

  // Validate event dates
  static validateEventDates(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  }

  // Check for overlapping events
  static async findOverlappingEvents(
    startDate: string, 
    endDate: string, 
    excludeId?: number
  ): Promise<Event[]> {
    let query = `
      SELECT * FROM events 
      WHERE (
        (start_date <= $1 AND end_date >= $1) OR
        (start_date <= $2 AND end_date >= $2) OR
        (start_date >= $1 AND end_date <= $2)
      )
    `;
    
    const params: any[] = [startDate, endDate];

    if (excludeId) {
      query += ' AND id != $3';
      params.push(excludeId);
    }

    const result = await executeQuery<any>(query, params);
    return result.rows.map(row => convertRowToCamelCase<Event>(row));
  }
}