import { Router } from 'express';
import { Technician } from '../data/models.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  const technicians = await Technician.find({}, '-_id -__v');
  res.json(technicians);
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { id, name, specialization, phone, email } = req.body;
  if (!id || !name || !specialization) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (await Technician.findOne({ id })) {
    return res.status(400).json({ error: 'Technician ID already exists' });
  }
  const tech = await Technician.create({
    id, name, specialization,
    phone: phone || '',
    email: email || '',
    status: 'Active'
  });
  res.status(201).json(tech);
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const result = await Technician.findOneAndDelete({ id: req.params.id });
  if (!result) return res.status(404).json({ error: 'Technician not found' });
  res.json({ message: 'Technician deleted' });
});

export default router;
