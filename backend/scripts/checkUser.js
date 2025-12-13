const db = require('../db');

async function checkUser() {
  try {
    const email = 'scs425114@gmail.com';
    console.log(`Checking for user: ${email}`);

    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (res.rows.length > 0) {
      console.log('FOUND: User exists in DB.');
      console.log('Details:', res.rows[0]);
    } else {
      console.log('NOT FOUND: User does not exist.');
    }
    process.exit(0);
  } catch (err) {
    console.error('DB Check Failed:', err);
    process.exit(1);
  }
}

checkUser();
