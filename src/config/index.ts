import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  ticketmaster: {
    apiKey: process.env.TICKETMASTER_API_KEY || '',
    baseUrl: 'https://app.ticketmaster.com/discovery/v2'
  },
  database: {
    path: path.join(process.cwd(), 'data', 'ticket-hawk.db')
  },
  monitoring: {
    intervalMinutes: 20,
    priceDropThreshold: 0.10 // 10% drop triggers notification
  }
};

// Validate required configuration
export function validateConfig(): void {
  if (!config.ticketmaster.apiKey) {
    throw new Error('TICKETMASTER_API_KEY is required in .env file');
  }
}
