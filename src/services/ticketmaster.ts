import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { TicketmasterEvent, TicketmasterSearchResponse, Event, PriceSnapshot } from '../types';
import { logger } from './logger';

class TicketmasterService {
  private api: AxiosInstance;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 200; // 5 requests per second = 200ms between requests

  constructor() {
    this.api = axios.create({
      baseURL: config.ticketmaster.baseUrl,
      params: {
        apikey: config.ticketmaster.apiKey
      }
    });
  }

  /**
   * Rate limiting: ensure we don't exceed 5 requests/second
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      logger.debug(`Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Search for events by keyword and optional city
   */
  async searchEvents(keyword: string, city?: string): Promise<TicketmasterEvent[]> {
    await this.rateLimit();

    try {
      const params: any = {
        keyword,
        countryCode: 'CA', // Canada
        sort: 'date,asc'
      };

      if (city) {
        params.city = city;
      }

      logger.info(`Searching Ticketmaster for: "${keyword}"${city ? ` in ${city}` : ''}`);

      const response = await this.api.get<TicketmasterSearchResponse>('/events.json', { params });

      const events = response.data._embedded?.events || [];
      logger.info(`Found ${events.length} events`);

      return events;
    } catch (error: any) {
      if (error.response) {
        logger.error(`Ticketmaster API error: ${error.response.status} - ${error.response.data?.fault?.faultstring || error.message}`);
      } else {
        logger.error(`Network error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get detailed information about a specific event including pricing
   */
  async getEventDetails(eventId: string): Promise<TicketmasterEvent | null> {
    await this.rateLimit();

    try {
      logger.info(`Fetching details for event: ${eventId}`);

      const response = await this.api.get<TicketmasterEvent>(`/events/${eventId}.json`);

      logger.info(`Retrieved event details: ${response.data.name}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Event not found: ${eventId}`);
        return null;
      }

      if (error.response) {
        logger.error(`Ticketmaster API error: ${error.response.status} - ${error.response.data?.fault?.faultstring || error.message}`);
      } else {
        logger.error(`Network error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Convert Ticketmaster event to our Event type
   */
  parseToEvent(tmEvent: TicketmasterEvent): Omit<Event, 'id'> {
    const venue = tmEvent._embedded?.venues?.[0];

    return {
      ticketmaster_id: tmEvent.id,
      name: tmEvent.name,
      event_date: tmEvent.dates.start.localDate,
      venue: venue?.name,
      city: venue?.city?.name,
      url: tmEvent.url,
      is_active: true
    };
  }

  /**
   * Extract price information as a snapshot
   */
  parseToPriceSnapshot(tmEvent: TicketmasterEvent, eventId: number): PriceSnapshot {
    const priceRange = tmEvent.priceRanges?.[0];

    // Determine availability based on price info
    let availability: 'available' | 'limited' | 'sold_out' = 'available';
    if (!priceRange) {
      availability = 'sold_out'; // No price info usually means sold out
    }

    return {
      event_id: eventId,
      min_price: priceRange?.min,
      max_price: priceRange?.max,
      currency: priceRange?.currency || 'CAD',
      availability
    };
  }

  /**
   * Display event information in a readable format
   */
  displayEvent(event: TicketmasterEvent): void {
    logger.info('========================================');
    logger.info(`Event: ${event.name}`);
    logger.info(`Date: ${event.dates.start.localDate}`);

    const venue = event._embedded?.venues?.[0];
    if (venue) {
      logger.info(`Venue: ${venue.name}, ${venue.city.name}`);
    }

    if (event.priceRanges && event.priceRanges.length > 0) {
      const price = event.priceRanges[0];
      logger.info(`Price Range: $${price.min} - $${price.max} ${price.currency}`);
    } else {
      logger.info('Price: Not available / Sold out');
    }

    logger.info(`URL: ${event.url}`);
    logger.info('========================================');
  }
}

// Export singleton instance
export const ticketmasterService = new TicketmasterService();
