import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Event, PriceSnapshot } from '../types';
import { logger } from '../services/logger';

class TicketDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info(`Created data directory: ${dataDir}`);
    }

    // Initialize database
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    logger.info(`Database initialized at: ${dbPath}`);

    // Initialize schema
    this.initializeSchema();
  }

  private initializeSchema(): void {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema (split by semicolons to handle multiple statements)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      this.db.exec(statement);
    }

    logger.info('Database schema initialized successfully');
  }

  /**
   * Add a new event to track
   */
  addEvent(event: Omit<Event, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO events (ticketmaster_id, name, event_date, venue, city, url, is_active)
      VALUES (@ticketmaster_id, @name, @event_date, @venue, @city, @url, @is_active)
    `);

    const result = stmt.run({
      ticketmaster_id: event.ticketmaster_id,
      name: event.name,
      event_date: event.event_date,
      venue: event.venue || null,
      city: event.city || null,
      url: event.url || null,
      is_active: event.is_active ? 1 : 0
    });

    logger.info(`Added event to database: ${event.name} (ID: ${result.lastInsertRowid})`);
    return Number(result.lastInsertRowid);
  }

  /**
   * Get all active events
   */
  getActiveEvents(): Event[] {
    const stmt = this.db.prepare(`
      SELECT * FROM events WHERE is_active = 1 ORDER BY event_date ASC
    `);

    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      ticketmaster_id: row.ticketmaster_id,
      name: row.name,
      event_date: row.event_date,
      venue: row.venue,
      city: row.city,
      url: row.url,
      is_active: Boolean(row.is_active)
    }));
  }

  /**
   * Get event by Ticketmaster ID
   */
  getEventByTicketmasterId(ticketmasterId: string): Event | null {
    const stmt = this.db.prepare(`
      SELECT * FROM events WHERE ticketmaster_id = ?
    `);

    const row = stmt.get(ticketmasterId) as any;
    if (!row) return null;

    return {
      id: row.id,
      ticketmaster_id: row.ticketmaster_id,
      name: row.name,
      event_date: row.event_date,
      venue: row.venue,
      city: row.city,
      url: row.url,
      is_active: Boolean(row.is_active)
    };
  }

  /**
   * Add a price snapshot
   */
  addPriceSnapshot(snapshot: PriceSnapshot): number {
    const stmt = this.db.prepare(`
      INSERT INTO price_snapshots (event_id, min_price, max_price, currency, availability)
      VALUES (@event_id, @min_price, @max_price, @currency, @availability)
    `);

    const result = stmt.run({
      event_id: snapshot.event_id,
      min_price: snapshot.min_price || null,
      max_price: snapshot.max_price || null,
      currency: snapshot.currency,
      availability: snapshot.availability
    });

    logger.info(`Added price snapshot for event ID ${snapshot.event_id}: $${snapshot.min_price}-$${snapshot.max_price}`);
    return Number(result.lastInsertRowid);
  }

  /**
   * Get recent snapshots for an event
   */
  getRecentSnapshots(eventId: number, limit: number = 10): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM price_snapshots
      WHERE event_id = ?
      ORDER BY checked_at DESC
      LIMIT ?
    `);

    return stmt.all(eventId, limit) as any[];
  }

  /**
   * Get the most recent snapshot for an event
   */
  getLatestSnapshot(eventId: number): any | null {
    const stmt = this.db.prepare(`
      SELECT * FROM price_snapshots
      WHERE event_id = ?
      ORDER BY checked_at DESC
      LIMIT 1
    `);

    return stmt.get(eventId) as any;
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
    logger.info('Database connection closed');
  }
}

// Create and export a singleton instance
let dbInstance: TicketDatabase | null = null;

export function getDatabase(): TicketDatabase {
  if (!dbInstance) {
    dbInstance = new TicketDatabase(config.database.path);
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
