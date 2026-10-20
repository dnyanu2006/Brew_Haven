import { Router } from 'express';
import { register, login, logout, getMe, toggleFavorite, updateProfile } from '../controllers/authController.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/favorites', requireAuth, toggleFavorite);
router.put('/profile', requireAuth, updateProfile);

export default router;
