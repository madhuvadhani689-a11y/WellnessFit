require('dotenv').config({ path: './.env' });
const { sendEmail } = require('./utils/emailService');

const run = async () => {
  console.log("Sending test email to madhuvadhani689@gmail.com ...");
  await sendEmail('madhuvadhani689@gmail.com', 'Test from WellnessFit 🌿', '<h3>It works!</h3><p>Your Gmail Nodemailer connection is successfully set up!</p>');
  console.log("Test execution finished. Exiting...");
};
run();
