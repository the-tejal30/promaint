import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../data/models.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = await User.findOne({ username });
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    techId: user.techId || null
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, user: payload });
});

export default router;
