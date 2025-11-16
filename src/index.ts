import { config, validateConfig } from './config';
import { getDatabase, closeDatabase } from './db/database';
import { ticketmasterService } from './services/ticketmaster';
import { logger } from './services/logger';

async function main() {
  try {
    logger.info('🦅 Ticket Hawk - Phase 1 Demo Starting...');
    logger.info('==========================================\n');

    // Step 1: Validate configuration
    logger.info('Step 1: Validating configuration...');
    validateConfig();
    logger.info('✅ Configuration validated\n');

    // Step 2: Initialize database
    logger.info('Step 2: Initializing database...');
    const db = getDatabase();
    logger.info('✅ Database initialized\n');

    // Step 3: Test Ticketmaster API - Search for events
    logger.info('Step 3: Testing Ticketmaster API - Searching for events...');
    const searchKeyword = 'concert';
    const searchCity = 'Toronto';
    const events = await ticketmasterService.searchEvents(searchKeyword, searchCity);

    if (events.length === 0) {
      logger.warn('No events found. Try a different search term or city.');
      return;
    }

    logger.info(`✅ Found ${events.length} events\n`);

    // Display first event details
    const firstEvent = events[0];
    ticketmasterService.displayEvent(firstEvent);

    // Step 4: Get detailed event information
    logger.info('\nStep 4: Fetching detailed event information...');
    const eventDetails = await ticketmasterService.getEventDetails(firstEvent.id);

    if (!eventDetails) {
      logger.error('Could not fetch event details');
      return;
    }

    logger.info('✅ Event details retrieved\n');

    // Step 5: Add event to database
    logger.info('Step 5: Adding event to database...');
    const parsedEvent = ticketmasterService.parseToEvent(eventDetails);

    // Check if event already exists
    const existingEvent = db.getEventByTicketmasterId(parsedEvent.ticketmaster_id);

    let eventId: number;
    if (existingEvent) {
      logger.info(`Event already exists in database (ID: ${existingEvent.id})`);
      eventId = existingEvent.id!;
    } else {
      eventId = db.addEvent(parsedEvent);
      logger.info(`✅ Event added to database (ID: ${eventId})\n`);
    }

    // Step 6: Record price snapshot
    logger.info('Step 6: Recording price snapshot...');
    const priceSnapshot = ticketmasterService.parseToPriceSnapshot(eventDetails, eventId);
    const snapshotId = db.addPriceSnapshot(priceSnapshot);
    logger.info(`✅ Price snapshot recorded (ID: ${snapshotId})\n`);

    // Step 7: Display recent snapshots
    logger.info('Step 7: Retrieving recent price snapshots...');
    const recentSnapshots = db.getRecentSnapshots(eventId, 5);
    logger.info(`Found ${recentSnapshots.length} snapshot(s):`);

    for (const snapshot of recentSnapshots) {
      const priceInfo = snapshot.min_price
        ? `$${snapshot.min_price} - $${snapshot.max_price} ${snapshot.currency}`
        : 'No price available';
      logger.info(`  - ${snapshot.checked_at}: ${priceInfo} (${snapshot.availability})`);
    }

    logger.info('\n==========================================');
    logger.info('✅ Phase 1 Demo Complete!');
    logger.info('==========================================\n');

    logger.info('Summary:');
    logger.info(`  • Database initialized at: ${config.database.path}`);
    logger.info(`  • Event tracked: ${parsedEvent.name}`);
    logger.info(`  • Event date: ${parsedEvent.event_date}`);
    logger.info(`  • Price snapshots recorded: ${recentSnapshots.length}`);
    logger.info('\nNext steps:');
    logger.info('  1. Phase 2: Add notification system');
    logger.info('  2. Phase 3: Add automated monitoring with cron');
    logger.info('  3. Phase 4: Add CLI interface for managing events');

  } catch (error: any) {
    logger.error('Error during demo:', error);
    if (error.response?.data) {
      logger.error('API Response:', error.response.data);
    }
    process.exit(1);
  } finally {
    // Clean up
    closeDatabase();
    logger.info('\n👋 Goodbye!');
  }
}

// Run the demo
main();
