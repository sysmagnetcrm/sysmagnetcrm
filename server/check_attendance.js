const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all('SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date FROM attendance', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Total records:', rows[0].count);
    console.log('Date range:', rows[0].min_date, 'to', rows[0].max_date);
  }
  
  db.all('SELECT date, COUNT(*) as count FROM attendance GROUP BY date ORDER BY date DESC LIMIT 10', (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('\nRecent dates:');
      rows.forEach(r => console.log(`  ${r.date}: ${r.count} records`));
    }
    db.close();
  });
});
