const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Simulate the API query
const query = `
  SELECT a.*, e.name as employee_name, e.employee_id as emp_code, e.department
  FROM attendance a
  JOIN employees e ON a.employee_id = e.id
  WHERE 1=1
  ORDER BY a.date DESC
  LIMIT 20
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(`Found ${rows.length} attendance records\n`);
    rows.slice(0, 5).forEach(r => {
      console.log(`${r.employee_name} (${r.emp_code}) - ${r.date} - ${r.status}`);
    });
  }
  db.close();
});
