const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Parse CLI args: --month=9 (1-12), --year=2025
const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.split('=');
  if (k && v) acc[k.replace(/^--/, '')] = v;
  return acc;
}, {});
const argMonth = args.month ? Math.max(1, Math.min(12, parseInt(args.month, 10))) : null; // 1-12
const argYear = args.year ? parseInt(args.year, 10) : null;

// Create tables first
db.serialize(() => {
  // Create employees table
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    position TEXT,
    hire_date DATE,
    pay_type TEXT CHECK(pay_type IN ('fixed', 'hourly')),
    base_salary DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    status TEXT DEFAULT 'active',
    bank_account TEXT,
    tax_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create attendance table
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    hours_worked DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status TEXT CHECK(status IN ('present', 'absent', 'half_day', 'leave', 'holiday')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE(employee_id, date)
  )`);

  // Seed employees if they don't exist
  db.get('SELECT COUNT(*) as count FROM employees', (err, result) => {
    if (err || result.count === 0) {
      console.log('Seeding employees...');
      const employees = [
        ['EMP001', 'Rajesh Kumar', 'rajesh@company.com', 'Engineering', 'Senior Developer', '2022-01-15', 'fixed', 30000, null],
        ['EMP002', 'Priya Sharma', 'priya@company.com', 'Sales', 'Sales Manager', '2021-06-10', 'fixed', 50000, null],
        ['EMP003', 'Revathi Nair', 'revathi@company.com', 'Marketing', 'Marketing Executive', '2023-03-20', 'fixed', 20000, null],
        ['EMP004', 'Sneha Patel', 'sneha@company.com', 'HR', 'HR Specialist', '2022-08-05', 'fixed', 25000, null],
        ['EMP005', 'Vikram Singh', 'vikram@company.com', 'Engineering', 'Junior Developer', '2023-09-01', 'hourly', null, 500],
        ['EMP006', 'Danush Reddy', 'danush@company.com', 'Finance', 'Finance Accountant', '2021-11-12', 'fixed', 30000, null]
      ];

      const stmt = db.prepare(`INSERT OR IGNORE INTO employees 
        (employee_id, name, email, department, position, hire_date, pay_type, base_salary, hourly_rate) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      employees.forEach(emp => stmt.run(emp));
      stmt.finalize(() => {
        console.log('✅ Employees seeded');
        seedAttendance();
      });
    } else {
      console.log(`Found ${result.count} existing employees`);
      seedAttendance();
    }
  });
});

function seedAttendance() {
// Get all employees first
db.all('SELECT id, employee_id, name, department FROM employees', (err, employees) => {
  if (err) {
    console.error('Error fetching employees:', err);
    db.close();
    return;
  }

  if (employees.length === 0) {
    console.log('No employees found. Please add employees first.');
    db.close();
    return;
  }

  console.log(`Found ${employees.length} employees. Adding attendance records...`);

  // Determine target dates: month/year -> full month; otherwise last 7 days
  const attendanceRecords = [];
  let dates = [];
  if (argMonth && argYear) {
    // Build list of all dates in the specified month
    const start = new Date(argYear, argMonth - 1, 1);
    const end = new Date(argYear, argMonth, 0); // last day of month
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
  } else {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
  }

  employees.forEach(emp => {
    dates.forEach(date => {
      const dateStr = new Date(date).toISOString().split('T')[0];

      // Random attendance patterns
      const rand = Math.random();
      let status, checkIn, checkOut, hoursWorked, overtime;

      if (rand < 0.7) {
        // Present (70% chance)
        status = 'present';
        checkIn = `09:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`;
        checkOut = `18:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`;
        hoursWorked = 8 + Math.random() * 2;
        overtime = hoursWorked > 8 ? hoursWorked - 8 : 0;
      } else if (rand < 0.85) {
        // Late (15% chance)
        status = 'half_day';
        checkIn = `10:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
        checkOut = `18:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`;
        hoursWorked = 6 + Math.random();
        overtime = 0;
      } else if (rand < 0.95) {
        // Leave (10% chance)
        status = 'leave';
        checkIn = null;
        checkOut = null;
        hoursWorked = 0;
        overtime = 0;
      } else {
        // Absent (5% chance)
        status = 'absent';
        checkIn = null;
        checkOut = null;
        hoursWorked = 0;
        overtime = 0;
      }

      attendanceRecords.push({
        employee_id: emp.id,
        date: dateStr,
        check_in: checkIn,
        check_out: checkOut,
        hours_worked: hoursWorked,
        overtime_hours: overtime,
        status: status,
        notes: status === 'leave' ? 'Planned leave' : (status === 'absent' ? 'Unplanned absence' : null)
      });
    });
  });

  // Insert attendance records
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO attendance 
    (employee_id, date, check_in, check_out, hours_worked, overtime_hours, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  attendanceRecords.forEach(record => {
    stmt.run(
      record.employee_id,
      record.date,
      record.check_in,
      record.check_out,
      record.hours_worked,
      record.overtime_hours,
      record.status,
      record.notes,
      (err) => {
        if (err) console.error('Error inserting:', err);
        else inserted++;
      }
    );
  });

  stmt.finalize(() => {
    const scope = argMonth && argYear ? `month ${argMonth}/${argYear}` : 'last 7 days';
    console.log(`✅ Successfully added ${inserted} attendance records for ${employees.length} employees over ${scope}`);
    
    // Show summary
    db.all(`
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance
      GROUP BY status
    `, (err, summary) => {
      if (!err) {
        console.log('\nAttendance Summary:');
        summary.forEach(s => console.log(`  ${s.status}: ${s.count}`));
      }
      db.close();
    });
  });
});
}
