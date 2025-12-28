# Fan Sentiment Tracking - Step-by-Step Setup Guide

**Last Updated**: January 2025  
**Purpose**: Complete step-by-step instructions for setting up and using fan sentiment tracking

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Supabase project set up
- ✅ Database schema migrated (includes `fan_sentiment_snapshots` table)
- ✅ Supabase CLI installed (`npm install -g supabase`)
- ✅ Apify account (free tier works for testing)

---

## 🚀 Step 1: Create Apify Account & Get Token

### 1.1 Sign Up for Apify
1. Go to **https://apify.com**
2. Click **"Sign Up"** (you can use Google/GitHub for quick signup)
3. Complete the registration

### 1.2 Get Your API Token
1. Log in to your Apify account
2. Click on your **profile icon** (top-right)
3. Go to **"Settings"** → **"Integrations"** → **"API tokens"**
4. Click **"Create new token"**
5. Give it a name (e.g., "PitchAI Sentiment")
6. **Copy the token** - you'll need it in the next step

> **Note**: Keep this token secure! You'll add it to Supabase secrets.

---

## 🗄️ Step 2: Verify Database Schema

### 2.1 Check Table Exists
1. Open **Supabase Dashboard**
2. Go to **"Table Editor"**
3. Verify you see `fan_sentiment_snapshots` table

### 2.2 If Table Doesn't Exist
1. Go to **"SQL Editor"** in Supabase Dashboard
2. Open `database/schema.sql` from your project
3. Find the `fan_sentiment_snapshots` table definition (around line 777)
4. Copy and paste the CREATE TABLE statement into SQL Editor
5. Click **"Run"**

The table should have these columns:
- `id`, `org_id`, `club_id`
- `sentiment_score`, `sentiment_mood`
- `positive_count`, `negative_count`, `neutral_count`, `total_mentions`
- `keywords_analyzed`, `data_source`, `snapshot_date`
- `created_at`, `updated_at`

---

## 🔧 Step 3: Deploy Edge Function

### 3.1 Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```

### 3.2 Login to Supabase
```bash
supabase login
```
- This will open a browser window
- Click **"Authorize"** to authenticate

### 3.3 Link Your Project
```bash
supabase link --project-ref your-project-ref
```
> **How to find your project ref:**
> - Go to Supabase Dashboard
> - Settings → General
> - Copy the "Reference ID" (looks like: `abcdefghijklmnop`)

### 3.4 Deploy the Function
```bash
supabase functions deploy fan-sentiment
```

Wait for deployment to complete. You should see:
```
✔ Deployed Function fan-sentiment
```

---

## 🔐 Step 4: Set Environment Variables

### 4.1 Add Secrets to Supabase
1. Go to **Supabase Dashboard**
2. Navigate to **"Edge Functions"** → **"Settings"**
3. Scroll to **"Secrets"** section
4. Click **"Add new secret"**

### 4.2 Add Required Secrets

**Secret 1: APIFY_TOKEN**
- **Key**: `APIFY_TOKEN`
- **Value**: (Paste your Apify API token from Step 1)
- Click **"Save"**

**Secret 2: GEMINI_API_KEY** (if not already set)
- **Key**: `GEMINI_API_KEY`
- **Value**: (Your Google Gemini API key)
- Click **"Save"**

**Secret 3: SUPABASE_SERVICE_ROLE_KEY** (if not already set)
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: (Get from Settings → API → service_role key)
- Click **"Save"**

### 4.3 Verify Secrets
You should see all three secrets listed:
- ✅ `APIFY_TOKEN`
- ✅ `GEMINI_API_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

---

## 🧪 Step 5: Test the Feature

### 5.1 Start Your Local Dev Server
```bash
npm run dev
```

### 5.2 Navigate to Dashboard
1. Log in to your application
2. Select your organization and club
3. Go to **"Dashboard"** tab (Command Center)

### 5.3 Check Fan Sentiment Widget
You should see the **"Fan Sentiment"** widget showing:
- Sentiment score (0-100%)
- Mood (Euphoric, Happy, Neutral, Worried, Angry)
- Mentions count
- Data source

### 5.4 Test Manual Refresh
1. Click the **refresh icon** (🔄) next to "Fan Sentiment"
2. Wait for the loading spinner
3. The sentiment should update with new data

**What happens:**
1. Frontend calls `refreshFanSentiment()` service
2. Service invokes `fan-sentiment` Edge Function
3. Edge Function:
   - Uses Apify to scrape Twitter for your club name
   - Analyzes tweets for sentiment
   - Stores result in database
   - Returns updated sentiment

---

## ⚙️ Step 6: Verify Data Storage

### 6.1 Check Database
1. Go to **Supabase Dashboard** → **"Table Editor"**
2. Select `fan_sentiment_snapshots` table
3. You should see a row with:
   - Your `club_id`
   - Today's date in `snapshot_date`
   - Sentiment score and mood
   - Counts (positive, negative, neutral)

### 6.2 Check Edge Function Logs
1. Go to **Supabase Dashboard** → **"Edge Functions"**
2. Click on **"fan-sentiment"**
3. Go to **"Logs"** tab
4. You should see logs from your refresh attempt

If you see errors:
- Check that `APIFY_TOKEN` is set correctly
- Verify Apify account has credits
- Check Edge Function logs for specific error messages

---

## 📅 Step 7: Set Up Daily Automatic Refresh (Optional)

The Inngest function `refreshFanSentiment.ts` is already created, but needs to be registered:

### 7.1 Register Inngest Function
This depends on your deployment setup. For now, the manual refresh works.

> **Note**: To enable automatic daily refreshes, you'll need to:
> 1. Set up Inngest in your deployment environment
> 2. Register the `refreshFanSentiment` function
> 3. It will run daily at 9 AM UTC

---

## 🐛 Troubleshooting

### Problem: "APIFY_TOKEN not configured"
**Solution**: 
- Go to Supabase Dashboard → Edge Functions → Settings → Secrets
- Verify `APIFY_TOKEN` is set
- Redeploy the function: `supabase functions deploy fan-sentiment`

### Problem: "No tweets found" or sentiment stays at 50%
**Solution**:
- Your club name might not have Twitter mentions
- Try with a well-known club name for testing
- Check Apify dashboard for actor run status
- Verify your Apify account has credits

### Problem: "Error refreshing fan sentiment"
**Solution**:
1. Check browser console for error messages
2. Check Supabase Edge Function logs
3. Verify all secrets are set correctly
4. Ensure database table exists and RLS allows inserts

### Problem: Sentiment shows as "mock" or doesn't update
**Solution**:
- Verify Supabase is configured (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set)
- Check that the Edge Function is deployed
- Try refreshing the page after clicking refresh button

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Apify account created and token obtained
- [ ] `fan_sentiment_snapshots` table exists in database
- [ ] Edge Function `fan-sentiment` is deployed
- [ ] All secrets are set in Supabase (APIFY_TOKEN, GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Fan Sentiment widget appears on Dashboard
- [ ] Manual refresh button works
- [ ] Data appears in `fan_sentiment_snapshots` table
- [ ] No errors in Edge Function logs

---

## 🎯 Next Steps

1. **Monitor Usage**: Check Apify dashboard for usage/credits
2. **Review Sentiment**: Verify sentiment scores make sense for your club
3. **Historical Data**: Use `getSentimentHistory()` to track trends
4. **Customize**: Adjust keyword lists in Edge Function if needed
5. **Automate**: Set up Inngest for daily automatic refreshes

---

## 📞 Support

If you encounter issues:
1. Check Edge Function logs in Supabase Dashboard
2. Check browser console for client-side errors
3. Verify all environment variables are set
4. Review the troubleshooting section above

---

**Congratulations! 🎉 Your fan sentiment tracking is now set up and ready to use!**


