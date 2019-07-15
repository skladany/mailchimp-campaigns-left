# MailChimp Campaigns Left

A simple node serverless function that uses the Mailchimp API to figure out how many free campaigns you have left to send (e.g, Sends / Contacts), then sends you an email with that result after the campaign is sent!

## Why?

If you're using the free tier of MailChimp, you're currently limited to 12000 email sent per month. How many campaings this will allow you to send, is therefore dependent on the size of your subscriber list. 

On the MailChimp account page, it shows you how many sends you have left, and how many contacts you currently have, but it  doesn't show you how many **campaigns** you have left?

Sure, we could do some simple math, but why not automate this!

## How?

1. After a MailChimp campaigns sends, it hits a webhook URL
2. That URL is the the serverless function (in my case, a Google Cloud function)
3. That function then hits the MailChimp API and determines how many campaigns are left
4. Once that's complete, it uses Gmail to send an email back to the person who sent the campaign, with a message similar to this:

```
Hi! You can send 11 more MailChimp Campaigns before the 9th day of this month!


Statistics
983 emails sent of your 12000 email limit
982 subscribers
11017 more emails you can send
11.218940936863543 campaigns left.
```

## Installation
1. Head over to the [Google Cloud Function](https://cloud.google.com/functions/) and sign up.
2. Create a new project, then create a new function.

### Create the function
1. Name: I'm using a long string of random characters as the name _(As I'm keeping it simple, there is no security so if someone knows the URL of this function, they'll be able to execute it. Therefore keeping the functin name long and random makes that less likely.)_
2. Memory: I left it at 256MB (which is overkill)
3. Trigger: HTTP
4. Authentication: Yes, allow unuthenticated invocations
5. Source Code: Copy and paste the contents of `index.js` and `package.json` into the editor (or upload a zip if you prefer)
6. Function to execute: `mailchimpCampaignsLeft`

### Add Environment Variables
1. Click on "Environment variables, networking, timeouts and more"
2. Scroll down to the `Name/Key` value area and add the following values:
3. `API_KEY` - This is your MailChimp API key
4. `RESET_DAY` - This is the day of the month that your mailchimp account resets (you can find this on the MailChimp Account page)
5. `EMAIL_LIMIT` - This is your MailChimp email limit -- probably `12000` if you're on the free tier.
6. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` -- [Follow this guide](https://medium.com/@nickroach_50526/sending-emails-with-node-js-using-smtp-gmail-and-oauth2-316fe9c790a1) for how to generate these credentials for your app. (Steps 2 - 4).
7. `FROM_EMAIL` - The address you want the email to come from (ideally same as the authenticated gmail account)
8. `TO_EMAIL` - One or more comma seperated emails to send the report to
9. Finally, hit "Create" to deploy your function.
10. Once that's complete, head to the trigger tab of your function and copy the URL

### Set up the MailChimp Webhook
1. Head to your MailChimp acount, click on Audience
2. On the right side, click "Manage Audience" and head to "Settings"
3. Scoll down and click on "Webhooks"
4. Click "Create new webook"
5. Enter the URL you copied from the above 10 step into the `Callback URL` field
4. Unselect all the boxes except for `Campaing sending`
5. Click `Save`

-----

That's it! The next time you send a MailChimp campaign, shortly thereafter you should receive an email of stats letting you know how many more campaigns you can send!



