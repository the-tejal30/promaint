import { Router } from 'express';
import { Equipment, Activity } from '../data/models.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { page = 1, limit = 50, search, status, frequency, pair } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { assetCode: { $regex: search, $options: 'i' } },
      { assetType: { $regex: search, $options: 'i' } },
      { area:      { $regex: search, $options: 'i' } },
      { zone:      { $regex: search, $options: 'i' } },
      { pair:      { $regex: search, $options: 'i' } }
    ];
  }
  if (status)    filter.status    = status;
  if (frequency) filter.frequency = frequency;
  if (pair)      filter.pair      = pair;

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Equipment.find(filter, '-_id -__v').skip(skip).limit(Number(limit)),
    Equipment.countDocuments(filter)
  ]);
  res.json({ data, total, page: Number(page), limit: Number(limit) });
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { id, name, category, location, manufacturer, model, installDate, status, notes } = req.body;
  if (!id || !name || !category || !location || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (await Equipment.findOne({ id })) {
    return res.status(400).json({ error: 'Equipment ID already exists' });
  }
  const newEquip = await Equipment.create({
    id, name, category, location,
    manufacturer: manufacturer || '',
    model: model || '',
    installDate: installDate || '',
    status,
    lastMaintenance: new Date().toISOString().split('T')[0],
    notes: notes || ''
  });
  await Activity.create({
    id: Date.now(),
    type: 'equipment',
    message: `Equipment ${id} - ${name} added to inventory`,
    time: new Date().toISOString().split('T')[0],
    icon: '⚙️'
  });
  res.status(201).json(newEquip);
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const equip = await Equipment.findOneAndUpdate(
    { id: req.params.id },
    { ...req.body, id: req.params.id },
    { new: true, projection: '-_id -__v' }
  );
  if (!equip) return res.status(404).json({ error: 'Equipment not found' });
  res.json(equip);
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const result = await Equipment.findOneAndDelete({ id: req.params.id });
  if (!result) return res.status(404).json({ error: 'Equipment not found' });
  res.json({ message: 'Equipment deleted' });
});

export default router;
