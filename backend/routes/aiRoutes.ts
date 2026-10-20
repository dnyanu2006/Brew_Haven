import { Router } from 'express';
import { getCoffeeRecommendations } from '../controllers/aiController.ts';

const router = Router();

router.post('/recommend', getCoffeeRecommendations);

export default router;
