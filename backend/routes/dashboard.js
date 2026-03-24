import { Router } from 'express';
import { Equipment, Schedule, WorkOrder, Activity } from '../data/models.js';

const router = Router();

router.get('/', async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

  const [
    totalEquipment,
    overdueTasks,
    allWorkOrders,
    upcomingTasks,
    recentActivity,
    allEquipment
  ] = await Promise.all([
    Equipment.countDocuments(),
    Schedule.countDocuments({ status: 'Overdue' }),
    WorkOrder.find({}, '-_id -__v'),
    Schedule.find({}, '-_id -__v').sort({ nextDue: 1 }).limit(8),
    Activity.find({}, '-_id -__v').sort({ id: -1 }).limit(10),
    Equipment.find({}, '-_id -__v')
  ]);

  const completedThisMonth = allWorkOrders.filter(w =>
    w.status === 'Completed' && (w.dueDate || w.createdDate) >= startOfMonthStr
  ).length;

  const openWorkOrders = allWorkOrders.filter(w => w.status !== 'Completed').length;

  const equipmentStatusCounts = { Active: 0, 'Under Maintenance': 0, Inactive: 0 };
  allEquipment.forEach(e => {
    if (equipmentStatusCounts[e.status] !== undefined) equipmentStatusCounts[e.status]++;
  });

  const priorityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  allWorkOrders.forEach(w => {
    if (w.status !== 'Completed' && priorityCounts[w.priority] !== undefined) priorityCounts[w.priority]++;
  });

  res.json({
    totalEquipment,
    overdueTasks,
    completedThisMonth,
    openWorkOrders,
    upcomingTasks,
    activity: recentActivity,
    equipmentStatusCounts,
    priorityCounts
  });
});

export default router;
