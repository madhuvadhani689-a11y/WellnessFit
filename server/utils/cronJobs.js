const cron = require('node-cron');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

const startCronJobs = () => {

  // Daily 8am — water reminder
  cron.schedule('0 8 * * *', async () => {
    try {
      const users = await User.find(
        { emailNotifications: { $ne: false } },
        'name email'
      );
      for (const user of users) {
        await sendEmail(
          user.email,
          '💧 Time to hydrate, ' + user.name + '!',
          `<div style="font-family:Arial;max-width:500px;
            margin:auto;padding:24px;
            background:#faf9f6;">
            <h2 style="color:#3d5a3e;">WellnessFit 🌿</h2>
            <p>Hi <strong>${user.name}</strong>!</p>
            <p style="font-size:16px;">
              Don't forget to drink water today 💧
            </p>
            <p>Small habits build big results. 
              You've got this!</p>
            <hr style="border:1px solid #e8e4dc;">
            <p style="color:#888;font-size:12px;">
              Your wellness journey · WellnessFit
            </p>
          </div>`
        );
      }
      console.log('Water reminders sent');
    } catch (err) {
      console.error('Water cron failed:', err.message);
    }
  });

  // Daily 9am — period reminder (3 days before)
  cron.schedule('0 9 * * *', async () => {
    try {
      const PCODLog = require('../models/PCODLog');
      const users = await User.find(
        { emailNotifications: { $ne: false } }
      );
      for (const user of users) {
        const log = await PCODLog
          .findOne({ user: user._id })
          .sort({ date: -1 });
        if (!log) continue;
        const avgCycle = log.averageCycleLength || 28;
        const daysLeft = avgCycle - (log.cycleDay || 1);
        if (daysLeft === 3) {
          await sendEmail(
            user.email,
            '🌸 Heads up ' + user.name + ' — period in 3 days',
            `<div style="font-family:Arial;max-width:500px;
              margin:auto;padding:24px;
              background:#faf9f6;">
              <h2 style="color:#3d5a3e;">WellnessFit 🌿</h2>
              <p>Hi <strong>${user.name}</strong>!</p>
              <p style="font-size:16px;">
                Your period may start in 
                <strong>3 days</strong> 🌸
              </p>
              <p>💜 Stock up on comfort foods, 
                rest well, and be gentle 
                with yourself.</p>
              <hr style="border:1px solid #e8e4dc;">
              <p style="color:#888;font-size:12px;">
                Your wellness journey · WellnessFit
              </p>
            </div>`
          );
        }
      }
    } catch (err) {
      console.error('Period cron failed:', err.message);
    }
  });

  // Every Monday 9am — weekly summary
  cron.schedule('0 9 * * 1', async () => {
    try {
      const users = await User.find(
        { emailNotifications: { $ne: false } }
      );
      for (const user of users) {
        await sendEmail(
          user.email,
          '📊 Your weekly wellness summary, ' + user.name,
          `<div style="font-family:Arial;max-width:500px;
            margin:auto;padding:24px;
            background:#faf9f6;">
            <h2 style="color:#3d5a3e;">WellnessFit 🌿</h2>
            <p>Hi <strong>${user.name}</strong>!</p>
            <p>Here's a reminder to check your 
              weekly progress in the app 📊</p>
            <a href="http://localhost:5173/analytics"
              style="background:#3d5a3e;color:white;
              padding:10px 20px;border-radius:8px;
              text-decoration:none;display:inline-block;
              margin-top:10px;">
              View My Progress →
            </a>
            <hr style="border:1px solid #e8e4dc;
              margin-top:20px;">
            <p style="color:#888;font-size:12px;">
              Your wellness journey · WellnessFit
            </p>
          </div>`
        );
      }
    } catch (err) {
      console.error('Weekly cron failed:', err.message);
    }
  });

  console.log('✅ Cron jobs started');
};

module.exports = { startCronJobs };
