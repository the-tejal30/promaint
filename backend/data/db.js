// In-memory database with seed data

const today = new Date();

function daysFromToday(days) {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const users = [
  { id: 1, username: process.env.ADMIN_USERNAME || 'admin', password: process.env.ADMIN_PASSWORD || 'admin123', role: 'admin', name: 'Admin User' },
  { id: 2, username: 'rajesh', password: 'emp123', role: 'employee', name: 'Rajesh Kumar', techId: 'EMP-001' },
  { id: 3, username: 'priya', password: 'emp123', role: 'employee', name: 'Priya Sharma', techId: 'EMP-002' },
];

export const DB = {
  equipment: [
    {
      id: 'EQ-001',
      name: 'Air Compressor Unit-1',
      category: 'Mechanical',
      location: 'Plant Floor A',
      manufacturer: 'Atlas Copco',
      model: 'GA-55',
      installDate: '2019-03-15',
      status: 'Active',
      lastMaintenance: daysFromToday(-30),
      notes: 'Primary air supply unit for production line'
    },
    {
      id: 'EQ-002',
      name: 'Conveyor Belt System',
      category: 'Mechanical',
      location: 'Assembly Line B',
      manufacturer: 'Flexlink',
      model: 'X65',
      installDate: '2020-07-22',
      status: 'Active',
      lastMaintenance: daysFromToday(-15),
      notes: 'Main assembly conveyor'
    },
    {
      id: 'EQ-003',
      name: 'Industrial HVAC Unit',
      category: 'HVAC',
      location: 'Roof Level',
      manufacturer: 'Carrier',
      model: 'AHU-500',
      installDate: '2018-11-10',
      status: 'Active',
      lastMaintenance: daysFromToday(-45),
      notes: 'Climate control for main production area'
    },
    {
      id: 'EQ-004',
      name: 'CNC Milling Machine',
      category: 'Mechanical',
      location: 'Machining Bay',
      manufacturer: 'Haas',
      model: 'VF-2',
      installDate: '2021-02-18',
      status: 'Under Maintenance',
      lastMaintenance: daysFromToday(-5),
      notes: 'High precision 3-axis milling machine'
    },
    {
      id: 'EQ-005',
      name: 'Main Distribution Panel',
      category: 'Electrical',
      location: 'Electrical Room',
      manufacturer: 'Schneider Electric',
      model: 'MasterPact',
      installDate: '2017-09-05',
      status: 'Active',
      lastMaintenance: daysFromToday(-60),
      notes: 'Primary electrical distribution'
    },
    {
      id: 'EQ-006',
      name: 'Hydraulic Press',
      category: 'Mechanical',
      location: 'Press Shop',
      manufacturer: 'Bosch Rexroth',
      model: 'HP-200',
      installDate: '2020-04-12',
      status: 'Active',
      lastMaintenance: daysFromToday(-20),
      notes: '200-ton hydraulic press for metal forming'
    },
    {
      id: 'EQ-007',
      name: 'Cooling Tower',
      category: 'HVAC',
      location: 'External Yard',
      manufacturer: 'Baltimore Aircoil',
      model: 'VFL-100',
      installDate: '2019-06-30',
      status: 'Inactive',
      lastMaintenance: daysFromToday(-90),
      notes: 'Process cooling system - seasonal'
    },
    {
      id: 'EQ-008',
      name: 'Emergency Generator',
      category: 'Electrical',
      location: 'Generator Room',
      manufacturer: 'Cummins',
      model: 'C550D5',
      installDate: '2018-01-20',
      status: 'Active',
      lastMaintenance: daysFromToday(-10),
      notes: '550kVA diesel generator for backup power'
    }
  ],

  schedule: [
    {
      id: 'PM-001',
      equipmentId: 'EQ-001',
      equipmentName: 'Air Compressor Unit-1',
      description: 'Oil Change & Filter Replacement',
      frequency: 'Monthly',
      lastDone: daysFromToday(-35),
      nextDue: daysFromToday(-5),
      assignedTo: 'EMP-001',
      assignedName: 'Rajesh Kumar',
      priority: 'High',
      status: 'Overdue',
      estimatedHours: 2
    },
    {
      id: 'PM-002',
      equipmentId: 'EQ-003',
      equipmentName: 'Industrial HVAC Unit',
      description: 'Filter Cleaning & Coil Inspection',
      frequency: 'Monthly',
      lastDone: daysFromToday(-28),
      nextDue: daysFromToday(2),
      assignedTo: 'EMP-003',
      assignedName: 'Amit Patel',
      priority: 'Medium',
      status: 'Scheduled',
      estimatedHours: 3
    },
    {
      id: 'PM-003',
      equipmentId: 'EQ-002',
      equipmentName: 'Conveyor Belt System',
      description: 'Belt Tension & Alignment Check',
      frequency: 'Weekly',
      lastDone: daysFromToday(-7),
      nextDue: daysFromToday(0),
      assignedTo: 'EMP-001',
      assignedName: 'Rajesh Kumar',
      priority: 'Critical',
      status: 'Due Today',
      estimatedHours: 1
    },
    {
      id: 'PM-004',
      equipmentId: 'EQ-005',
      equipmentName: 'Main Distribution Panel',
      description: 'Thermal Imaging & Connection Check',
      frequency: 'Quarterly',
      lastDone: daysFromToday(-95),
      nextDue: daysFromToday(-4),
      assignedTo: 'EMP-002',
      assignedName: 'Priya Sharma',
      priority: 'Critical',
      status: 'Overdue',
      estimatedHours: 4
    },
    {
      id: 'PM-005',
      equipmentId: 'EQ-006',
      equipmentName: 'Hydraulic Press',
      description: 'Fluid Level & Seal Inspection',
      frequency: 'Monthly',
      lastDone: daysFromToday(-20),
      nextDue: daysFromToday(10),
      assignedTo: 'EMP-001',
      assignedName: 'Rajesh Kumar',
      priority: 'High',
      status: 'Scheduled',
      estimatedHours: 2
    },
    {
      id: 'PM-006',
      equipmentId: 'EQ-008',
      equipmentName: 'Emergency Generator',
      description: 'Load Test & Battery Check',
      frequency: 'Monthly',
      lastDone: daysFromToday(-10),
      nextDue: daysFromToday(20),
      assignedTo: 'EMP-002',
      assignedName: 'Priya Sharma',
      priority: 'High',
      status: 'Scheduled',
      estimatedHours: 3
    },
    {
      id: 'PM-007',
      equipmentId: 'EQ-004',
      equipmentName: 'CNC Milling Machine',
      description: 'Lubrication & Axis Calibration',
      frequency: 'Weekly',
      lastDone: daysFromToday(-14),
      nextDue: daysFromToday(-7),
      assignedTo: 'EMP-001',
      assignedName: 'Rajesh Kumar',
      priority: 'Critical',
      status: 'Overdue',
      estimatedHours: 2
    },
    {
      id: 'PM-008',
      equipmentId: 'EQ-007',
      equipmentName: 'Cooling Tower',
      description: 'Water Treatment & Fan Inspection',
      frequency: 'Quarterly',
      lastDone: daysFromToday(-91),
      nextDue: daysFromToday(0),
      assignedTo: 'EMP-003',
      assignedName: 'Amit Patel',
      priority: 'Medium',
      status: 'Due Today',
      estimatedHours: 4
    }
  ],

  workOrders: [
    {
      num: 'WO-2024-001',
      equipmentId: 'EQ-004',
      equipment: 'CNC Milling Machine',
      description: 'Spindle bearing replacement due to excessive vibration',
      type: 'Corrective',
      assignedTo: 'Rajesh Kumar',
      createdDate: daysFromToday(-10),
      dueDate: daysFromToday(-3),
      status: 'In Progress',
      priority: 'Critical'
    },
    {
      num: 'WO-2024-002',
      equipmentId: 'EQ-001',
      equipment: 'Air Compressor Unit-1',
      description: 'Pressure relief valve replacement',
      type: 'Corrective',
      assignedTo: 'Rajesh Kumar',
      createdDate: daysFromToday(-7),
      dueDate: daysFromToday(1),
      status: 'Open',
      priority: 'High'
    },
    {
      num: 'WO-2024-003',
      equipmentId: 'EQ-005',
      equipment: 'Main Distribution Panel',
      description: 'Install additional circuit breakers for new equipment',
      type: 'Modification',
      assignedTo: 'Priya Sharma',
      createdDate: daysFromToday(-5),
      dueDate: daysFromToday(7),
      status: 'Open',
      priority: 'Medium'
    },
    {
      num: 'WO-2024-004',
      equipmentId: 'EQ-002',
      equipment: 'Conveyor Belt System',
      description: 'Belt replacement - section 3 showing wear',
      type: 'Preventive',
      assignedTo: 'Amit Patel',
      createdDate: daysFromToday(-15),
      dueDate: daysFromToday(-2),
      status: 'Completed',
      priority: 'High'
    },
    {
      num: 'WO-2024-005',
      equipmentId: 'EQ-003',
      equipment: 'Industrial HVAC Unit',
      description: 'Refrigerant recharge and leak detection',
      type: 'Corrective',
      assignedTo: 'Amit Patel',
      createdDate: daysFromToday(-3),
      dueDate: daysFromToday(4),
      status: 'Open',
      priority: 'Medium'
    },
    {
      num: 'WO-2024-006',
      equipmentId: 'EQ-008',
      equipment: 'Emergency Generator',
      description: 'Annual overhaul and fuel system inspection',
      type: 'Preventive',
      assignedTo: 'Priya Sharma',
      createdDate: daysFromToday(-20),
      dueDate: daysFromToday(-5),
      status: 'Completed',
      priority: 'Low'
    }
  ],

  technicians: [
    {
      id: 'EMP-001',
      name: 'Rajesh Kumar',
      specialization: 'Mechanical',
      phone: '+91 98765 43210',
      email: 'rajesh@company.com',
      status: 'Active'
    },
    {
      id: 'EMP-002',
      name: 'Priya Sharma',
      specialization: 'Electrical',
      phone: '+91 87654 32109',
      email: 'priya@company.com',
      status: 'Active'
    },
    {
      id: 'EMP-003',
      name: 'Amit Patel',
      specialization: 'HVAC',
      phone: '+91 76543 21098',
      email: 'amit@company.com',
      status: 'Active'
    },
    {
      id: 'EMP-004',
      name: 'Sunita Verma',
      specialization: 'General',
      phone: '+91 65432 10987',
      email: 'sunita@company.com',
      status: 'Active'
    }
  ],

  activity: [
    {
      id: 1,
      type: 'workorder',
      message: 'Work Order WO-2024-001 created for CNC Milling Machine',
      time: daysFromToday(-10),
      icon: '📋'
    },
    {
      id: 2,
      type: 'complete',
      message: 'PM Task PM-003 completed for Conveyor Belt System',
      time: daysFromToday(-7),
      icon: '✅'
    },
    {
      id: 3,
      type: 'workorder',
      message: 'Work Order WO-2024-004 completed - Belt replacement done',
      time: daysFromToday(-2),
      icon: '✅'
    },
    {
      id: 4,
      type: 'alert',
      message: 'Equipment EQ-004 status changed to Under Maintenance',
      time: daysFromToday(-5),
      icon: '⚠️'
    },
    {
      id: 5,
      type: 'workorder',
      message: 'Work Order WO-2024-005 created for Industrial HVAC Unit',
      time: daysFromToday(-3),
      icon: '📋'
    }
  ]
};

export let woCounter = 7;
export const incrementWoCounter = () => { woCounter++; };
