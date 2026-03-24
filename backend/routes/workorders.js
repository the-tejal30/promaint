import { Router } from 'express';
import { WorkOrder, Activity } from '../data/models.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  const workOrders = await WorkOrder.find({}, '-_id -__v');
  res.json(workOrders);
});

router.post('/', authenticate, async (req, res) => {
  const { equipmentId, equipment, description, type, assignedTo, dueDate, priority } = req.body;
  if (!equipment || !description || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const year = new Date().getFullYear();
  const count = await WorkOrder.countDocuments();
  const num = `WO-${year}-${String(count + 1).padStart(3, '0')}`;

  const newWO = await WorkOrder.create({
    num,
    equipmentId: equipmentId || '',
    equipment,
    description,
    type,
    assignedTo: assignedTo || '',
    createdDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate || '',
    status: 'Open',
    priority: priority || 'Medium'
  });

  await Activity.create({
    id: Date.now(),
    type: 'workorder',
    message: `Work Order ${num} created for ${equipment}`,
    time: new Date().toISOString().split('T')[0],
    icon: '📋'
  });

  res.status(201).json(newWO);
});

router.delete('/:num', authenticate, requireAdmin, async (req, res) => {
  const result = await WorkOrder.findOneAndDelete({ num: req.params.num });
  if (!result) return res.status(404).json({ error: 'Work order not found' });
  res.json({ message: 'Work order deleted' });
});

router.patch('/:num/complete', authenticate, async (req, res) => {
  const wo = await WorkOrder.findOneAndUpdate(
    { num: req.params.num },
    { status: 'Completed' },
    { new: true, projection: '-_id -__v' }
  );
  if (!wo) return res.status(404).json({ error: 'Work order not found' });

  await Activity.create({
    id: Date.now(),
    type: 'complete',
    message: `Work Order ${req.params.num} marked as Completed`,
    time: new Date().toISOString().split('T')[0],
    icon: '✅'
  });

  res.json(wo);
});

export default router;
