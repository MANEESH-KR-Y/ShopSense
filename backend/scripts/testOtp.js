const db = require('../db');
const User = require('../models/User');

async function testOtpFlow() {
  try {
    console.log('--- STARTING OTP TEST ---');

    // 1. Get a user
    const result = await db.query('SELECT * FROM users LIMIT 1');
    if (result.rows.length === 0) {
      console.error('No users found in DB to test with.');
      process.exit(1);
    }
    const user = result.rows[0];
    console.log(`Testing with User: ${user.email} (ID: ${user.id})`);

    // 2. Generate OTP
    const otp = '123456';
    console.log(`Generated OTP: ${otp}`);

    // 3. Update OTP
    console.log('Updating OTP in DB...');
    await User.updateOtp(user.id, otp);
    console.log('OTP Updated.');

    // 4. Check DB directly
    const check = await db.query(
      'SELECT otp, otp_expires_at, NOW() as server_now FROM users WHERE id=$1',
      [user.id]
    );
    const row = check.rows[0];
    console.log(`[DB STATE] OTP: '${row.otp}'`);
    console.log(`[DB STATE] Expiry: ${row.otp_expires_at}`);
    console.log(`[DB STATE] Server Time: ${row.server_now}`);

    // 5. Verify using Model
    console.log('Verifying using User.verifyOtp()...');
    const isValid = await User.verifyOtp(user.id, otp);

    if (isValid) {
      console.log('SUCCESS: OTP Verified Successfully!');
    } else {
      console.error('FAILURE: OTP Verification Failed!');
    }

    process.exit(0);
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
}

testOtpFlow();
