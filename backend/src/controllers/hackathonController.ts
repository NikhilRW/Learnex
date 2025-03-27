import {Request, Response} from 'express';
import {ScraperService} from '../services/scraperService';
import {EventSource, HackathonSummary} from '../types/hackathon';

/**
 * Get all hackathons from various sources like HackerEarth, Devfolio
 * @route GET /api/hackathons
 * @access Public
 */
export const getHackathons = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Get location filter if provided, default to India
    const location = (req.query.location || 'India') as string;

    // Fetch from multiple sources in parallel
    const [hackerEarthEvents, devfolioEvents] = await Promise.all([
      ScraperService.fetchHackerEarthHackathons(location),
      ScraperService.fetchDevfolioHackathons(location),
    ]);

    // Combine and sort by start date (most recent first)
    const allEvents = [...hackerEarthEvents, ...devfolioEvents].sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

    res.status(200).json({
      success: true,
      count: allEvents.length,
      data: allEvents,
    });
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hackathon data',
      error: process.env.NODE_ENV === 'development' ? error : {},
    });
  }
};

/**
 * Get hackathon details by ID
 * @route GET /api/hackathons/:source/:id
 * @access Public
 */
export const getHackathonById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {id, source} = req.params;

    // Convert string source to EventSource enum
    let eventSource: EventSource;
    if (source.toLowerCase() === 'hackerearth') {
      eventSource = EventSource.HACKEREARTH;
    } else if (source.toLowerCase() === 'devfolio') {
      eventSource = EventSource.DEVFOLIO;
    } else {
      // Invalid source
      res.status(400).json({
        success: false,
        message:
          'Invalid source platform. Must be "hackerearth" or "devfolio".',
      });
      return;
    }

    // Find the base hackathon to get its URL - first try cache
    let baseHackathon;
    const cachedHackathons =
      ScraperService.getAllHackathonsFromCacheIfAvailable();

    if (cachedHackathons) {
      // Try to find in cache first (super fast)
      baseHackathon = cachedHackathons.find(
        h => h.id === id && h.source === eventSource,
      );
      if (baseHackathon) {
        console.log(`Found hackathon ${id} in cache`);
      }
    }

    // If not found in cache, fetch fresh data
    if (!baseHackathon) {
      console.log(`Hackathon ${id} not found in cache, fetching fresh data`);
      let summaries: HackathonSummary[] = [];

      // Only fetch from the relevant source to minimize work
      if (eventSource === EventSource.HACKEREARTH) {
        summaries = await ScraperService.fetchHackerEarthHackathons('');
      } else {
        summaries = await ScraperService.fetchDevfolioHackathons('');
      }

      baseHackathon = summaries.find(h => h.id === id);
    }

    if (!baseHackathon) {
      res.status(404).json({
        success: false,
        message: 'Hackathon not found',
      });
      return;
    }

    console.log(`Fetching details for ${baseHackathon.title} (${id})`);

    // Fetch the event details using the scraper service with correct typing
    const eventDetails = await ScraperService.fetchHackathonDetails(
      eventSource,
      id,
      baseHackathon.url,
    );

    if (!eventDetails) {
      res.status(404).json({
        success: false,
        message: 'Event details not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: eventDetails,
    });
  } catch (error) {
    console.error('Error fetching hackathon details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hackathon details',
      error: process.env.NODE_ENV === 'development' ? error : {},
    });
  }
};
