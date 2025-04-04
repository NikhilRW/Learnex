import axios from 'axios';
import {
  HackathonSummary,
  HackathonDetails,
  HackathonsResponse,
  HackathonResponse,
  EventSource,
  EventMode,
} from '../types/hackathon';

// Base URL for the API
const API_BASE_URL = 'https://learnex-backend.vercel.app/api';

// Fallback mock data in case the API is not available
const MOCK_EVENTS: HackathonSummary[] = [
  {
    id: 'he-001',
    source: EventSource.HACKEREARTH,
    title: 'TechSprint 2023',
    description: 'Build innovative solutions for real-world problems',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days from now
    location: 'Bangalore, India',
    mode: EventMode.HYBRID,
    registrationDeadline: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ).toISOString(), // 5 days from now
    imageUrl: 'https://example.com/techsprint.jpg',
    url: 'https://hackerearth.com/techsprint-2023',
  },
  {
    id: 'he-002',
    source: EventSource.HACKEREARTH,
    title: 'AI Innovation Challenge',
    description: 'Solve complex problems using artificial intelligence',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days from now
    location: 'Mumbai, India',
    mode: EventMode.ONLINE,
    registrationDeadline: new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000,
    ).toISOString(), // 10 days from now
    imageUrl: 'https://example.com/ai-challenge.jpg',
    url: 'https://hackerearth.com/ai-innovation-challenge',
  },
  {
    id: 'df-001',
    source: EventSource.DEVFOLIO,
    title: 'Hack Revolution',
    description: 'A 36-hour hackathon to revolutionize the tech industry',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    location: 'Delhi, India',
    mode: EventMode.IN_PERSON,
    registrationDeadline: new Date(
      Date.now() + 1 * 24 * 60 * 60 * 1000,
    ).toISOString(), // 1 day from now
    imageUrl: 'https://example.com/hack-revolution.jpg',
    url: 'https://devfolio.co/hack-revolution',
  },
  {
    id: 'df-002',
    source: EventSource.DEVFOLIO,
    title: 'BlockChain Buildathon',
    description: 'Create innovative blockchain solutions',
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
    endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(), // 23 days from now
    location: 'Hyderabad, India',
    mode: EventMode.HYBRID,
    registrationDeadline: new Date(
      Date.now() + 15 * 24 * 60 * 60 * 1000,
    ).toISOString(), // 15 days from now
    imageUrl: 'https://example.com/blockchain-buildathon.jpg',
    url: 'https://devfolio.co/blockchain-buildathon',
  },
];

// Extended details for mock events
const MOCK_EVENT_DETAILS: Record<string, HackathonDetails> = {
  'he-001': {
    ...MOCK_EVENTS[0],
    prizes: {
      first: '₹1,00,000',
      second: '₹50,000',
      third: '₹25,000',
      other: ['Best UI/UX: ₹10,000', 'Most Innovative: ₹10,000'],
    },
    sponsors: ['TechCorp', 'InnovateTech', 'CodeLabs'],
    eligibility: 'Open to all college students and professionals',
    tags: ['AI', 'ML', 'Cloud', 'Web', 'Mobile'],
    teamSize: {
      min: 2,
      max: 4,
    },
  },
  'he-002': {
    ...MOCK_EVENTS[1],
    prizes: {
      first: '₹1,50,000',
      second: '₹75,000',
      third: '₹50,000',
    },
    sponsors: ['AI Solutions', 'DataTech', 'CloudMinds'],
    eligibility: 'Open to all with knowledge of AI/ML',
    rulesUrl: 'https://example.com/rules.pdf',
    tags: ['AI', 'ML', 'Data Science', 'Deep Learning'],
    teamSize: {
      min: 1,
      max: 3,
    },
  },
  'df-001': {
    ...MOCK_EVENTS[2],
    prizes: {
      first: '₹2,00,000',
      second: '₹1,00,000',
      third: '₹50,000',
    },
    sponsors: ['RevTech', 'InnoHub', 'TechStart'],
    eligibility: 'Open to all developers and designers',
    tags: ['Web3', 'Mobile', 'AR/VR', 'IoT'],
    teamSize: {
      min: 3,
      max: 5,
    },
  },
  'df-002': {
    ...MOCK_EVENTS[3],
    prizes: {
      first: 'ETH 2.0',
      second: 'ETH 1.0',
      third: 'ETH 0.5',
      other: ['Best Use of Smart Contracts: ETH 0.2'],
    },
    sponsors: ['Ethereum Foundation', 'Polygon', 'Web3 Alliance'],
    eligibility: 'Open to blockchain developers and enthusiasts',
    tags: ['Blockchain', 'Web3', 'DeFi', 'Smart Contracts'],
    teamSize: {
      min: 2,
      max: 4,
    },
  },
};

/**
 * Service for fetching hackathon and event data from the backend API
 */
export class HackathonService {
  /**
   * Fetch all hackathons with optional location filter
   * @param location Optional location filter (defaults to India)
   * @returns Promise with hackathon data
   */
  public static async getHackathons(
    location: string = 'India',
  ): Promise<HackathonSummary[]> {
    try {
      const response = await axios.get<HackathonsResponse>(
        `${API_BASE_URL}/hackathons?location=${encodeURIComponent(location)}`,
      );

      // Return the data array or empty array if request fails
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      throw error;
    }
  }

  /**
   * Fetch details for a specific hackathon
   * @param source Source platform (hackerearth or devfolio)
   * @param id Hackathon ID
   * @returns Promise with hackathon details
   */
  public static async getHackathonDetails(
    source: string,
    id: string,
  ): Promise<HackathonDetails | null> {
    try {
      const response = await axios.get<HackathonResponse>(
        `${API_BASE_URL}/hackathons/${source}/${id}`,
      );

      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Error fetching hackathon details:', error);
      throw error;
    }
  }
}
