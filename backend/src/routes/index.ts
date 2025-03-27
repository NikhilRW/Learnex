import express from 'express';
import {getStatus} from '../controllers/statusController';

const router = express.Router();

// Status route
router.get('/status', getStatus);

export default router;
