# 🦅 Ticket Hawk

A TypeScript/Node.js application that monitors Ticketmaster event prices and sends notifications when prices drop.

## Phase 1: Foundation ✅

This is Phase 1 of the project, which establishes the core foundation:

- ✅ Database initialization (SQLite)
- ✅ Ticketmaster API integration
- ✅ Event search and tracking
- ✅ Price snapshot recording
- ✅ Structured logging

## Features

### Current (Phase 1)
- Search for events on Ticketmaster (Canada)
- Fetch detailed event information including pricing
- Store events in SQLite database
- Record price snapshots over time
- Rate-limited API requests (5 requests/second)
- Comprehensive logging with Winston

### Coming Soon
- **Phase 2**: Email/SMS notifications when prices drop
- **Phase 3**: Automated monitoring with cron scheduling
- **Phase 4**: CLI interface for managing tracked events

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Database**: SQLite (better-sqlite3)
- **HTTP Client**: Axios
- **Logging**: Winston
- **Environment**: dotenv

## Project Structure

```
ticket-hawk/
├── .env                    # API keys (gitignored)
├── .env.example            # Template for configuration
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── config/
│   │   └── index.ts       # Configuration loader
│   ├── db/
│   │   ├── schema.sql     # Database schema
│   │   └── database.ts    # Database wrapper
│   ├── services/
│   │   ├── logger.ts      # Winston logger setup
│   │   └── ticketmaster.ts # Ticketmaster API service
│   ├── types/
│   │   └── index.ts       # TypeScript interfaces
│   └── index.ts           # Main entry point
└── data/
    └── ticket-hawk.db     # SQLite database (gitignored)
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Ticketmaster API key (free tier available)

### 1. Get a Ticketmaster API Key

1. Visit [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
2. Create a free account
3. Register a new app to get your API key

### 2. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd ticket-hawk

# Install dependencies
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API key
# TICKETMASTER_API_KEY=your_actual_api_key_here
```

### 4. Run the Demo

```bash
# Run the Phase 1 demo
npm run dev
```

This will:
1. Initialize the database
2. Search for concerts in Toronto
3. Fetch details for the first event found
4. Add the event to the database
5. Record a price snapshot
6. Display all information in the console

## Usage

### Development

```bash
npm run dev        # Run with tsx (no compilation needed)
```

### Production

```bash
npm run build      # Compile TypeScript to JavaScript
npm start          # Run compiled code
```

## Database Schema

### Events Table
Stores information about tracked events:
- `ticketmaster_id`: Unique Ticketmaster event ID
- `name`: Event name
- `event_date`: Date of the event
- `venue`: Venue name
- `city`: City name
- `url`: Ticketmaster event URL
- `is_active`: Whether we're still tracking this event

### Price Snapshots Table
Stores historical price data:
- `event_id`: Reference to events table
- `checked_at`: Timestamp of the price check
- `min_price`: Minimum ticket price
- `max_price`: Maximum ticket price
- `currency`: Currency code (CAD)
- `availability`: 'available', 'limited', or 'sold_out'

### Notifications Table
Tracks sent notifications (for future phases):
- `event_id`: Reference to events table
- `notification_type`: Type of notification sent
- `sent_at`: When the notification was sent
- `details`: Additional notification details

## API Rate Limiting

The Ticketmaster API allows 5 requests per second. The application automatically handles rate limiting to ensure compliance.

## Configuration

Configuration is loaded from environment variables via `.env`:

```typescript
{
  ticketmaster: {
    apiKey: process.env.TICKETMASTER_API_KEY,
    baseUrl: 'https://app.ticketmaster.com/discovery/v2'
  },
  database: {
    path: './data/ticket-hawk.db'
  },
  monitoring: {
    intervalMinutes: 20,
    priceDropThreshold: 0.10  // 10% drop triggers notification
  }
}
```

## Example Output

```
2024-01-15 10:30:00 [info]: 🦅 Ticket Hawk - Phase 1 Demo Starting...
2024-01-15 10:30:00 [info]: Step 1: Validating configuration...
2024-01-15 10:30:00 [info]: ✅ Configuration validated

2024-01-15 10:30:01 [info]: Step 2: Initializing database...
2024-01-15 10:30:01 [info]: Database initialized at: ./data/ticket-hawk.db
2024-01-15 10:30:01 [info]: ✅ Database initialized

2024-01-15 10:30:01 [info]: Step 3: Testing Ticketmaster API...
2024-01-15 10:30:02 [info]: Found 20 events
2024-01-15 10:30:02 [info]: ========================================
2024-01-15 10:30:02 [info]: Event: Taylor Swift | The Eras Tour
2024-01-15 10:30:02 [info]: Date: 2024-08-15
2024-01-15 10:30:02 [info]: Venue: Rogers Centre, Toronto
2024-01-15 10:30:02 [info]: Price Range: $49.50 - $449.50 CAD
2024-01-15 10:30:02 [info]: ========================================
```

## Development Notes

- TypeScript strict mode is enabled
- All database operations use prepared statements for safety
- Comprehensive error handling throughout
- Winston logging provides structured logs
- Clean separation of concerns (config, db, services, types)

## Roadmap

### Phase 2: Notifications
- [ ] Email notifications via SMTP
- [ ] SMS notifications (optional)
- [ ] Notification throttling/deduplication
- [ ] Price drop detection logic

### Phase 3: Automated Monitoring
- [ ] Cron-based price checking
- [ ] Configurable check intervals
- [ ] Multiple event tracking

### Phase 4: CLI Interface
- [ ] Add events via command line
- [ ] List tracked events
- [ ] View price history
- [ ] Remove/pause events

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

ISC

---

Built with ❤️ and TypeScript
