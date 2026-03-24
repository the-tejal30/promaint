import { Router } from 'express';
import { Schedule, Activity } from '../data/models.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

const freqDays = { Daily: 1, Weekly: 7, Monthly: 30, 'Bi Monthly': 60, Quarterly: 91, 'Half Yearly': 182, Annually: 365 };

function computeStatus(nextDue) {
  if (!nextDue) return 'Scheduled';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDue);
  due.setHours(0, 0, 0, 0);
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Due Today';
  return 'Scheduled';
}

router.get('/', async (req, res) => {
  const { page = 1, limit = 50, search, frequency } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { id:            { $regex: search, $options: 'i' } },
      { equipmentName: { $regex: search, $options: 'i' } },
      { description:   { $regex: search, $options: 'i' } }
    ];
  }
  if (frequency) filter.frequency = frequency;

  const skip = (Number(page) - 1) * Number(limit);
  const [tasks, total] = await Promise.all([
    Schedule.find(filter, '-_id -__v').skip(skip).limit(Number(limit)),
    Schedule.countDocuments(filter)
  ]);
  const data = tasks.map(t => ({ ...t.toObject(), status: computeStatus(t.nextDue) }));
  res.json({ data, total, page: Number(page), limit: Number(limit) });
});

router.post('/', authenticate, async (req, res) => {
  const { equipmentId, equipmentName, description, frequency, lastDone, nextDue, assignedTo, assignedName, priority, estimatedHours } = req.body;
  if (!equipmentId || !description || !frequency || !nextDue) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const count = await Schedule.countDocuments();
  const newId = `PM-${String(count + 1).padStart(3, '0')}`;
  const task = await Schedule.create({
    id: newId, equipmentId,
    equipmentName: equipmentName || equipmentId,
    description, frequency,
    lastDone: lastDone || null,
    nextDue,
    assignedTo: assignedTo || '',
    assignedName: assignedName || '',
    priority: priority || 'Medium',
    status: computeStatus(nextDue),
    estimatedHours: estimatedHours || 1
  });
  res.status(201).json(task);
});

router.put('/:id', authenticate, async (req, res) => {
  const updates = { ...req.body, id: req.params.id };
  if (updates.nextDue) updates.status = computeStatus(updates.nextDue);
  const task = await Schedule.findOneAndUpdate(
    { id: req.params.id },
    updates,
    { new: true, projection: '-_id -__v' }
  );
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const result = await Schedule.findOneAndDelete({ id: req.params.id });
  if (!result) return res.status(404).json({ error: 'Task not found' });
  res.json({ message: 'Task deleted' });
});

router.patch('/:id/done', authenticate, async (req, res) => {
  const task = await Schedule.findOne({ id: req.params.id });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const days = freqDays[task.frequency] || 30;
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + days);
  const nextDue = nextDate.toISOString().split('T')[0];

  const updated = await Schedule.findOneAndUpdate(
    { id: req.params.id },
    { lastDone: todayStr, nextDue, status: 'Scheduled' },
    { new: true, projection: '-_id -__v' }
  );

  await Activity.create({
    id: Date.now(),
    type: 'complete',
    message: `PM Task ${task.id} completed for ${task.equipmentName}`,
    time: todayStr,
    icon: '✅'
  });

  res.json(updated);
});

export default router;
