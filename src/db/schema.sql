-- Events being tracked
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticketmaster_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  venue TEXT,
  city TEXT,
  url TEXT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

-- Price snapshots over time
CREATE TABLE IF NOT EXISTS price_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  min_price REAL,
  max_price REAL,
  currency TEXT DEFAULT 'CAD',
  availability TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Track sent notifications to avoid spam
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  notification_type TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
