import express from 'express';
import {
    getHackathons,
    getHackathonById,
} from '../controllers/hackathonController';

const router = express.Router();

// Get all hackathons
router.get('/', getHackathons);

// Get hackathon by id and source
router.get('/:source/:id', getHackathonById);

export default router;
