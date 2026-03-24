import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  pair: String,
  level: String,
  zone: String,
  area: String,
  assetType: String,
  assetCode: String,
  frequency: String,
  status: String,
  name: String,
  category: String,
  location: String,
  manufacturer: String,
  model: String,
  installDate: String,
  lastMaintenance: String,
  notes: String
});

const scheduleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  equipmentId: String,
  equipmentName: String,
  description: String,
  frequency: String,
  lastDone: String,
  nextDue: String,
  assignedTo: String,
  assignedName: String,
  priority: String,
  status: String,
  estimatedHours: Number
});

const workOrderSchema = new mongoose.Schema({
  num: { type: String, required: true, unique: true },
  equipmentId: String,
  equipment: String,
  description: String,
  type: String,
  assignedTo: String,
  createdDate: String,
  dueDate: String,
  status: String,
  priority: String
});

const technicianSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  specialization: String,
  phone: String,
  email: String,
  status: String
});

const activitySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  type: String,
  message: String,
  time: String,
  icon: String
});

const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: String,
  role: String,
  name: String,
  techId: String
});

export const Equipment = mongoose.model('Equipment', equipmentSchema);
export const Schedule = mongoose.model('Schedule', scheduleSchema);
export const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);
export const Technician = mongoose.model('Technician', technicianSchema);
export const Activity = mongoose.model('Activity', activitySchema);
export const User = mongoose.model('User', userSchema);
