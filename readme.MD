## Shared-Journal-Backend

Server side code written in nodejs for shared journal web app

## Monthly Email Cron Job

The server automatically sends monthly journal update emails on **day 3 of each month at 5pm Pacific Time**.

### Manual Email Trigger

If the automatic cron job fails or you need to re-send emails, you can manually trigger the monthly email send:

```
GET https://new-shared-journal.herokuapp.com/stayAwake/triggerMonthlyEmail?secret=YOUR_JWT_PASSWORD
```

Replace `YOUR_JWT_PASSWORD` with the value of the `JWT_PASSWORD` environment variable from Heroku.

**Note:** Emails are sent in batches over ~5 hours (20 batches, 15 minutes apart) to avoid email rate limits.

### Check Status

To check the cron job status and email sending stats:

```
GET https://new-shared-journal.herokuapp.com/stayAwake/status?secret=YOUR_JWT_PASSWORD
```

This returns:
- Server time
- Last cron run time and status
- Number of users processed
- Emails sent count (since last server restart)

### Logs

All email-related activity is logged with prefixes for easy filtering:
- `[CRON]` - Cron job events
- `[COMPILE]` - Per-journal compilation
- `[EMAIL]` - Individual email sends

View logs with:
```bash
heroku logs --tail -a new-shared-journal
heroku logs -n 500 -a new-shared-journal | grep "\[EMAIL\]"
```