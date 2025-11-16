export interface Event {
  id?: number;
  ticketmaster_id: string;
  name: string;
  event_date: string;
  venue?: string;
  city?: string;
  url?: string;
  is_active: boolean;
}

export interface PriceSnapshot {
  event_id: number;
  min_price?: number;
  max_price?: number;
  currency: string;
  availability: 'available' | 'limited' | 'sold_out';
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
    };
  };
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      city: { name: string };
    }>;
  };
  url: string;
}

export interface TicketmasterSearchResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}
