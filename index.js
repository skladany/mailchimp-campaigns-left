/**
 * Env Config
 */

require("dotenv").config();
const Mailchimp = require("mailchimp-api-v3");

const { API_KEY, RESET_DAY, EMAIL_LIMIT } = process.env;

/**
 * Using the REST_DAY env variable, get the reset date
 * @return {string} Reset Date
 */
function getResetDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Zero indexed

  return `${year}-${month}-${RESET_DAY}`;
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

  const resetDate = getResetDate();

  try {
    const result = await mailchimp.request({
      method: "get",
      path: `/campaigns?since_send_time=${resetDate}`
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
async function getCampaignsLeft() {
  const subscriberCount = await getSubscriberCount();
  const emailSent = await getEmailsSent();

  return Math.floor((EMAIL_LIMIT - emailSent) / subscriberCount);
}

getCampaignsLeft().then(result => {
  console.log(result);
});
