// Event source enum for better type safety
export enum EventSource {
  HACKEREARTH = 'hackerearth',
  DEVFOLIO = 'devfolio',
}

// Event mode enum
export enum EventMode {
  ONLINE = 'online',
  IN_PERSON = 'in-person',
  HYBRID = 'hybrid',
}

// Interface for a hackathon/event summary
export interface HackathonSummary {
  id: string;
  source: EventSource;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  mode: EventMode;
  registrationDeadline: string;
  imageUrl?: string;
  url: string;
}

// Extended interface for detailed event information
export interface HackathonDetails extends HackathonSummary {
  // Additional details that might be available
  prizes?: {
    first?: string;
    second?: string;
    third?: string;
    other?: string[];
  };
  sponsors?: string[];
  eligibility?: string;
  rulesUrl?: string;
  tags?: string[];
  teamSize?: {
    min: number;
    max: number;
  };
}

// API response for hackathon listings
export interface HackathonsResponse {
  success: boolean;
  count: number;
  data: HackathonSummary[];
}

// API response for a single hackathon
export interface HackathonResponse {
  success: boolean;
  data: HackathonDetails;
}
