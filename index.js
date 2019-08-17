/**
 * Env Config
 */

require("dotenv").config();
const Mailchimp = require("mailchimp-api-v3");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const {
  API_KEY,
  RESET_DAY,
  EMAIL_LIMIT,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  TO_EMAIL,
  FROM_EMAIL
} = process.env;

/**
 * Finds the number of campaigns left to send, and sends off an email!
 * @return {integer} Campaigns left
 */
exports.mailchimpCampaignsLeft = async (req, res) => {
  const subscriberCount = await getSubscriberCount();
  const emailSent = await getEmailsSent();

  const campaignsLeft = getCampaignsLeft(subscriberCount, emailSent);
  const nextResetDate = getNextResetDate();

  sendEmail(
    `There are ${campaignsLeft} MailChimp Campaigns left to send!`,
    `Hi! You can send <strong>${campaignsLeft}</strong> more MailChimp Campaigns before ${nextResetDate}!<br><br><br>
    <strong>Statistics:</strong>
    <ul>
        <li><strong>${emailSent}</strong> emails sent of your <strong>${EMAIL_LIMIT}</strong> email limit</li>
        <li><strong>${subscriberCount}</strong> subscribers</li>
        <li><strong>${EMAIL_LIMIT -
          emailSent}</strong> more emails you can send</li>
        <li><strong>${(EMAIL_LIMIT - emailSent) /
          subscriberCount}</strong> campaigns left.</li>
    </ul>`
  );

  res.send("OK");
};

/**
 * Using the REST_DAY env variable, get the reset date
 * @return {string} Reset Date
 */
function getLastResetDate() {
  // Get today's Day
  const date = new Date();

  /* If Day (e.g, `date.getDate()` ) >= RESET_DAY then we want this month's month. 
  Since the Month is zero-indexed in the date object, we increment it by one. 
  
  If the reverse is true, we want the previous month and since it's zero-indexed,
  doing nothing effectively gives us that. */

  if (date.getDate() >= RESET_DAY) {
    date.setMonth(date.getMonth() + 1);
  }

  return `${date.getFullYear()}-${date.getMonth()}-${RESET_DAY}`;
}

/**
 * Using getLastResetDate(), gets the next reset date
 * @return {string} Next Reset Date
 */
function getNextResetDate() {
  const date = new Date(getLastResetDate());

  // Zero indexed
  date.setMonth(date.getMonth() + 2);

  return `${date.getFullYear()}-${date.getMonth()}-${RESET_DAY}`;
}

/**
 * Returns the number current subscribers
 * @return {integer} Current subscribers
 */
async function getSubscriberCount() {
  const mailchimp = new Mailchimp(API_KEY);

  try {
    const result = await mailchimp.request({
      method: "get",
      path: "/"
    });

    const subcribers = await result.total_subscribers;

    return subcribers;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Returns the number of emails sent so far since the reset date
 * @return {integer} Emails sent
 */
async function getEmailsSent() {
  const mailchimp = new Mailchimp(API_KEY);

  const lastResetDate = getLastResetDate();

  try {
    const result = await mailchimp.request({
      method: "get",
      path: `/campaigns?since_send_time=${lastResetDate}`
    });

    const emailsSent = result.campaigns.reduce(
      (total, current, i, campaign) => {
        const emailSent = campaign[i].emails_sent || 0;

        return total + emailSent;
      },
      0
    );

    return emailsSent;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Returns the number of campaigns left to send
 * @return {integer} Campaigns left
 */
function getCampaignsLeft(subscriberCount, emailSent) {
  // Avoid devide by zero
  if (!subscriberCount) return;

  return Math.floor((EMAIL_LIMIT - emailSent) / subscriberCount);
}

/**
 * Sends an email!
 *
 * https://medium.com/@nickroach_50526/sending-emails-with-node-js-using-smtp-gmail-and-oauth2-316fe9c790a1
 * @param {string} Email subject
 * @param {string} Email content
 * @return {null} Email is sent off!
 */

async function sendEmail(subject, content) {
  const oauth2Client = new OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Redirect URL
  );

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
  });

  const accessToken = oauth2Client.getAccessToken();

  const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: FROM_EMAIL,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken
    }
  });

  const mailOptions = {
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject,
    generateTextFromHTML: true,
    html: content
  };

  smtpTransport.sendMail(mailOptions, (error, response) => {
    error ? console.log(error) : console.log(response);
    smtpTransport.close();
  });
}
