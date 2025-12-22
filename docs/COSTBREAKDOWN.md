# PitchSide AI — Cost Breakdown & Deployment Budget

> Comprehensive cost analysis for deploying and running PitchSide AI in production

---

## Table of Contents

1. [Core Services (Required)](#core-services-required)
2. [Optional Services](#optional-services)
3. [Total Cost by Tier](#total-cost-by-tier)
4. [Launch Strategy](#recommended-launch-strategy)
5. [Cost Optimization Tips](#cost-optimization-tips)
6. [Revenue Threshold Calculator](#revenue-threshold-calculator)

---

## Core Services (Required)

### 1. Supabase (Database + Auth + Edge Functions)

#### Free Tier - $0/month
- ✅ **Good for:** Development, testing, small deployments
- **Database:** 500 MB space
- **Bandwidth:** 2 GB/month
- **Auth Users:** 50,000 monthly active users
- **Edge Functions:** 500,000 invocations/month
- **Edge Function Bandwidth:** 2 GB/month
- **Backups:** None
- **Support:** Community only
- **⚠️ Limitations:** Database pauses after 1 week of inactivity, limited support

#### Pro Tier - $25/month ⭐ RECOMMENDED
- ✅ **Recommended for production**
- **Database:** 8 GB space
- **Bandwidth:** 50 GB/month
- **Auth Users:** 100,000 monthly active users
- **Edge Functions:** 2 million invocations/month
- **Edge Function Bandwidth:** 50 GB/month
- **Backups:** Daily (7 days retention)
- **Support:** Email support
- **No pausing:** Service stays active
- **Best for:** 50-500 active clubs

#### Team Tier - $599/month
- **Database:** 100 GB space
- **Bandwidth:** 250 GB/month
- **Auth Users:** Unlimited
- **Security:** Advanced features
- **Support:** Priority support
- **Best for:** 500+ active clubs, agencies with multiple clients

**Recommendation:** Start with **Pro ($25/mo)**, upgrade as you grow

---

### 2. Google Gemini AI (Platform AI Key)

#### Free Tier - $0/month
- ✅ 60 requests per minute
- Good for testing and development
- Rate limits may be restrictive for production

#### Pay-as-you-go Pricing (Gemini 1.5 Flash - Recommended)
- **Input:** $0.075 per 1M tokens (~$0.000075 per 1K tokens)
- **Output:** $0.30 per 1M tokens (~$0.0003 per 1K tokens)

#### Real-World Cost Examples

**Typical AI operations in PitchSide:**

| Operation | Input Tokens | Output Tokens | Cost per Generation |
|-----------|--------------|---------------|---------------------|
| Player analysis | 1,500 | 500 | $0.00026 |
| Match report | 2,000 | 800 | $0.00039 |
| Social media post | 800 | 200 | $0.00012 |
| Email smart reply | 500 | 150 | $0.00008 |
| Sponsor content | 1,200 | 600 | $0.00027 |

#### Monthly Cost Estimates

| Usage Level | Generations/Day | Monthly Cost |
|-------------|-----------------|--------------|
| **Light** | 50 | $3-5 |
| **Medium** | 200 | $12-20 |
| **Heavy** | 1,000 | $60-100 |
| **Very Heavy** | 5,000 | $300-500 |

**💡 Pro Tip:** Users with BYOK (Bring Your Own Key) pay their own Gemini costs! This can save you 80-90% of AI expenses.

---

### 3. Gmail API (Email Integration)

**Cost:** **FREE** ✅

#### Quotas (per user)
- **Daily Quota:** 1 billion quota units
- **Reading an email:** 5 units
- **Sending an email:** 100 units
- **Syncing 100 emails:** ~500 units

#### Translation to Real Usage
- ~200 million email reads per day per user
- ~10 million email sends per day per user

**Realistically:** You will never hit these limits  
**Total Cost:** $0

---

### 4. Microsoft Graph API (Outlook Integration)

**Cost:** **FREE** ✅

#### Throttling Limits
- 10,000 API requests per 10 minutes per user
- Mail operations have very generous limits
- No per-request charges

**Realistically:** Free for all practical usage  
**Total Cost:** $0

---

### 5. Frontend Hosting

#### Option A: Vercel (Recommended)

**Hobby Plan - FREE** ✅
- 100 GB bandwidth/month
- Unlimited sites
- Automatic HTTPS
- Global CDN
- **Good for:** Development, small production

**Pro Plan - $20/month**
- 1 TB bandwidth/month
- Advanced analytics
- Team collaboration
- Password protection
- **Good for:** Serious production

#### Option B: Netlify

**Starter - FREE** ✅
- 100 GB bandwidth/month
- 300 build minutes/month
- Similar to Vercel Hobby

**Pro - $19/month**
- 1 TB bandwidth/month
- More build minutes

#### Option C: Cloudflare Pages (Most Cost-Effective)

**Free - FREE** ✅
- **Unlimited bandwidth** 🎉
- 500 builds/month
- Global CDN
- Automatic HTTPS
- **Best for:** Cost optimization

**Recommendation:** Start with **Free tier** on Cloudflare Pages for unlimited bandwidth

---

### 6. Domain Name (Optional but Recommended)

**Cost:** $10-15/year (~$1/month)
- .com domain via Namecheap, Google Domains, Cloudflare
- Adds professional branding
- Custom email addresses

**Examples:**
- pitchsideai.com
- yourclub.ai
- clubmanager.app

---

## Optional Services

### 7. Error Tracking (Sentry)

#### Free Tier - $0/month
- 5,000 errors/month
- 1 user
- 30 days retention
- Good for small apps

#### Team - $26/month
- 50,000 errors/month
- 5 users
- 90 days retention
- More features

**Recommendation:** Start free, upgrade when you have consistent traffic

---

### 8. Analytics

#### Plausible Analytics - $9/month
- Privacy-friendly analytics
- 10,000 pageviews/month
- GDPR compliant
- No cookie banner needed

#### PostHog - Free tier available
- Product analytics
- Feature flags
- Session recording
- Generous free tier

#### Google Analytics - FREE
- Full-featured analytics
- No cost
- More complex setup

**Recommendation:** Use free tier or skip initially, add when you need insights

---

### 9. Monitoring (Optional)

#### Uptime Robot - FREE
- 50 monitors
- 5-minute checks
- Email alerts

#### BetterStack - $20/month
- Advanced monitoring
- Status pages
- Incident management

**Recommendation:** Use free Uptime Robot for basic monitoring

---

## Total Cost by Tier

### 🎯 Tier 1: MVP Launch (Recommended Start)

| Service | Plan | Monthly Cost | Annual Cost |
|---------|------|--------------|-------------|
| **Supabase** | Pro | $25.00 | $300.00 |
| **Gemini AI** | Pay-as-you-go | $5-20 | $60-240 |
| **Gmail API** | Free | $0.00 | $0.00 |
| **Outlook API** | Free | $0.00 | $0.00 |
| **Cloudflare Pages** | Free | $0.00 | $0.00 |
| **Domain** | Annual | ~$1.00 | $12.00 |
| **Sentry** | Free | $0.00 | $0.00 |

**Monthly Total: $31-46**  
**Annual Total: $372-552**

**What You Get:**
- ✅ Up to 100,000 monthly active users
- ✅ 2M Edge Function calls/month
- ✅ 8 GB database
- ✅ 50 GB bandwidth
- ✅ Professional email integrations
- ✅ AI-powered features
- ✅ Custom domain
- ✅ Error tracking
- ✅ Suitable for 50-100 active clubs

---

### 📈 Tier 2: Growth Production

| Service | Plan | Monthly Cost | Annual Cost |
|---------|------|--------------|-------------|
| **Supabase** | Pro | $25.00 | $300.00 |
| **Gemini AI** | Pay-as-you-go | $50-150 | $600-1,800 |
| **Gmail/Outlook** | Free | $0.00 | $0.00 |
| **Vercel** | Pro | $20.00 | $240.00 |
| **Domain** | Annual | ~$1.00 | $12.00 |
| **Sentry** | Team | $26.00 | $312.00 |
| **Analytics** | Plausible | $9.00 | $108.00 |

**Monthly Total: $131-231**  
**Annual Total: $1,572-2,772**

**What You Get:**
- ✅ Same database/auth capacity
- ✅ Higher AI usage
- ✅ Better hosting (1TB bandwidth)
- ✅ Professional error tracking
- ✅ Analytics insights
- ✅ Suitable for 100-500 active clubs

---

### 🚀 Tier 3: Enterprise Scale

| Service | Plan | Monthly Cost | Annual Cost |
|---------|------|--------------|-------------|
| **Supabase** | Team | $599.00 | $7,188.00 |
| **Gemini AI** | Pay-as-you-go | $200-500 | $2,400-6,000 |
| **Gmail/Outlook** | Free | $0.00 | $0.00 |
| **Vercel** | Pro+ | $40-150 | $480-1,800 |
| **Domain** | Annual | ~$1.00 | $12.00 |
| **Sentry** | Business | $80.00 | $960.00 |
| **Analytics** | Pro | $29.00 | $348.00 |
| **Monitoring** | BetterStack | $20.00 | $240.00 |

**Monthly Total: $949-1,359**  
**Annual Total: $11,388-16,308**

**What You Get:**
- ✅ Unlimited auth users
- ✅ 100 GB database
- ✅ 250 GB bandwidth
- ✅ Priority support
- ✅ Advanced security
- ✅ Professional monitoring
- ✅ Suitable for 500+ clubs, agencies

---

## Recommended Launch Strategy

### Phase 1: MVP Launch ($30-50/month) ⭐

**When:** Initial launch, first customers

**Stack:**
```
✅ Supabase Pro            $25/mo
✅ Gemini AI Platform Key  $5-20/mo (pay-as-you-go)
✅ Cloudflare Pages        FREE
✅ Domain name             $1/mo ($12/year)
✅ Sentry Free Tier        FREE
✅ Gmail/Outlook OAuth     FREE

Total: ~$31-46/month
```

**Capacity:**
- 50-100 active clubs
- Thousands of AI generations
- Unlimited email connections
- Professional features

**When to Upgrade:** 
- More than 50 active clubs with heavy usage
- AI costs consistently above $50/mo
- Need advanced analytics

---

### Phase 2: Growth ($100-200/month)

**When:** 50+ active clubs, consistent revenue

**Upgrades:**
```
✅ Keep Supabase Pro       $25/mo
✅ Increase AI budget      $50-100/mo
✅ Upgrade hosting         $20/mo (Vercel Pro)
✅ Add analytics           $9/mo (Plausible)
✅ Better error tracking   $26/mo (Sentry Team)

Total: ~$130-180/month
```

**Benefits:**
- Better insights into usage
- Professional error tracking
- Higher capacity hosting
- Scales to 100-500 clubs

---

### Phase 3: Scale ($600+/month)

**When:** 500+ active clubs, multiple agencies

**Upgrades:**
```
✅ Supabase Team           $599/mo
✅ High AI usage           $200-500/mo
✅ Professional hosting    $40-150/mo
✅ Full monitoring stack   $80-130/mo

Total: ~$950-1,400/month
```

**Benefits:**
- Enterprise-grade infrastructure
- Priority support
- Advanced security
- Scales to thousands of clubs

---

## Cost Optimization Tips

### 1. 🔑 BYOK (Bring Your Own Key) Strategy

**Impact:** Save 80-90% of AI costs

**How it works:**
- Let agencies/clubs use their own Gemini API keys
- Platform key only for trials and free tier users
- They pay their own AI costs directly to Google

**Example savings:**
- Without BYOK: $200/mo AI costs for 50 clubs
- With BYOK: $20/mo AI costs (only free tier users)
- **Savings: $180/mo**

---

### 2. 💾 Database Optimization

**Impact:** Stay on Pro tier longer

**Strategies:**
- Regular cleanup of old AI conversations
- Archive old emails after 90 days
- Optimize queries with proper indexes
- Use Supabase caching

**Example savings:**
- Pro tier ($25/mo) vs Team tier ($599/mo)
- **Savings: $574/mo by staying on Pro**

---

### 3. ⚡ Edge Function Optimization

**Impact:** Stay under invocation limits

**Strategies:**
- Cache AI responses for common queries
- Batch operations where possible
- Optimize function code
- Use Supabase Realtime instead of polling

**Pro tier limit:** 2M calls/month (very generous)

---

### 4. 🌐 Free Hosting with Cloudflare Pages

**Impact:** Save $20/mo vs paid hosting

**Benefits:**
- Unlimited bandwidth (vs 100GB on free tiers)
- Global CDN
- Automatic HTTPS
- Free forever

**Savings vs Vercel Pro:** $20/mo = $240/year

---

### 5. 📧 Email Quotas Are Generous

**Impact:** No scaling costs for email

**Reality:**
- Gmail/Outlook APIs are free
- Quotas are per-user (not per app)
- Nearly impossible to hit limits

**Result:** Email scales for free 🎉

---

### 6. 🧪 Use Free Tier for Development

**Impact:** Save $25-50/mo during development

**Strategy:**
- Development: Supabase Free Tier
- Staging: Supabase Free Tier
- Production: Supabase Pro

**Savings during 3-month development:** $75-150

---

## Revenue Threshold Calculator

### Break-Even Analysis

**Fixed costs (MVP tier): $31-46/month**

| Your Price per Club | Clubs Needed | Monthly Revenue | Monthly Profit |
|--------------------|--------------|-----------------|----------------|
| $10/club/mo | 5 clubs | $50 | $4-19 |
| $20/club/mo | 3 clubs | $60 | $14-29 |
| $30/club/mo | 2 clubs | $60 | $14-29 |
| $50/club/mo | 1 club | $50 | $4-19 |
| $100/club/mo | 1 club | $100 | $54-69 |

**Key Insight: You only need 2-5 paying clubs to be profitable!**

---

### Growth Scenario

**Assumptions:**
- $50/club/month pricing
- 50% of clubs use BYOK (pay own AI costs)
- Growth tier costs: $130/mo

| Month | Clubs | Revenue | Costs | Profit | Cumulative |
|-------|-------|---------|-------|--------|------------|
| 1 | 5 | $250 | $50 | $200 | $200 |
| 3 | 15 | $750 | $80 | $670 | $1,870 |
| 6 | 40 | $2,000 | $130 | $1,870 | $10,420 |
| 12 | 100 | $5,000 | $180 | $4,820 | $52,420 |

**With just 100 clubs at $50/mo, you're earning ~$4,800/month profit!**

---

### Agency Model Pricing

**If you target agencies managing multiple clubs:**

| Agency Tier | Clubs Included | Your Price | Your Cost | Profit |
|-------------|----------------|------------|-----------|--------|
| **Starter** | 1-5 clubs | $100/mo | $40 | $60/mo |
| **Growth** | 6-20 clubs | $300/mo | $70 | $230/mo |
| **Pro** | 21-50 clubs | $750/mo | $130 | $620/mo |
| **Enterprise** | 50+ clubs | $1,500/mo | $300 | $1,200/mo |

**Just 5 agencies on Pro tier = $3,100/mo profit!**

---

## Free Tier vs Production Comparison

### Free Tier (Development/Testing Only)

| Aspect | Limitation | Impact |
|--------|------------|--------|
| **Database** | Pauses after 1 week | ❌ Not production-ready |
| **Bandwidth** | 2 GB/month | ❌ Too limited |
| **Edge Functions** | 500K calls/month | ⚠️ Might be enough |
| **Support** | Community only | ❌ No help when issues arise |
| **AI** | 60 req/min limit | ❌ Too restrictive |
| **Backups** | None | ❌ Data loss risk |

**Total Cost: $0**  
**Verdict:** Only for testing, demos, proof of concept

---

### MVP Production (Recommended)

| Aspect | Capacity | Impact |
|--------|----------|--------|
| **Database** | Always on, 8GB | ✅ Production-ready |
| **Bandwidth** | 50 GB/month | ✅ Plenty for 100+ clubs |
| **Edge Functions** | 2M calls/month | ✅ Very generous |
| **Support** | Email support | ✅ Help when needed |
| **AI** | Pay-as-you-go | ✅ Scales with usage |
| **Backups** | Daily (7 days) | ✅ Data protected |

**Total Cost: $31-46/month**  
**Verdict:** Professional, reliable, affordable

---

## Special Considerations

### Multi-Tenancy Benefits

**Your architecture supports multiple orgs/clubs from ONE deployment:**

- ✅ One Supabase project serves all customers
- ✅ One frontend deployment serves all customers
- ✅ RLS policies ensure data isolation
- ✅ Costs don't multiply per customer

**This means:**
- 1 club costs you $31/mo
- 100 clubs costs you $31/mo (plus AI usage)
- **Massive economies of scale!**

---

### BYOK as Competitive Advantage

**Problem:** Some clubs worry about AI costs scaling

**Solution:** BYOK option

**Benefits:**
1. Clubs have full control over AI costs
2. They can use their own Gemini quotas
3. You have zero AI cost for BYOK users
4. Reduces your risk as you scale
5. Attracts cost-conscious enterprise clients

**Pricing Strategy:**
- Basic tier: $X/mo with platform AI (you pay AI costs)
- Pro tier: $X+20/mo with BYOK option (they pay AI costs)
- Agency tier: BYOK included (they manage own costs)

---

## Cost Summary Table

| Tier | Monthly | Annual | Suitable For | Break-Even Clubs |
|------|---------|--------|--------------|------------------|
| **Free** (Dev) | $0 | $0 | Testing only | N/A |
| **MVP** ⭐ | $31-46 | $372-552 | 1-100 clubs | 2-3 clubs |
| **Growth** | $130-230 | $1,560-2,760 | 100-500 clubs | 7-12 clubs |
| **Enterprise** | $950-1,350 | $11,400-16,200 | 500+ clubs | 20-30 clubs |

---

## Final Recommendation 🎯

### Start Here: MVP Production Stack

**Investment: ~$31-46/month**

```
✅ Supabase Pro            $25/month
✅ Gemini AI               $5-20/month (grows with usage)
✅ Cloudflare Pages        FREE (unlimited bandwidth!)
✅ Domain                  $12/year ($1/month)
✅ Gmail/Outlook OAuth     FREE
✅ Sentry                  FREE (5K errors/month)

Total: $31-46/month
```

**This gives you:**
- ✅ Production-ready infrastructure
- ✅ Can handle 50-100 active clubs
- ✅ Thousands of AI generations per month
- ✅ Unlimited email connections
- ✅ Professional features
- ✅ Room to grow

**You become profitable with just 2-3 paying customers!**

---

### Scaling Path

**As you grow:**

1. **0-5 clubs:** MVP tier ($31-46/mo)
2. **5-50 clubs:** MVP tier, optimize (stay at $50-80/mo)
3. **50-100 clubs:** Consider Growth tier ($130-180/mo)
4. **100-500 clubs:** Growth tier with optimizations ($180-250/mo)
5. **500+ clubs:** Enterprise tier ($950+/mo)

**The key:** BYOK strategy keeps your costs from scaling linearly with customers!

---

## Additional Resources

- **Supabase Pricing:** https://supabase.com/pricing
- **Gemini AI Pricing:** https://ai.google.dev/pricing
- **Vercel Pricing:** https://vercel.com/pricing
- **Cloudflare Pages:** https://pages.cloudflare.com/
- **Sentry Pricing:** https://sentry.io/pricing/

---

## Questions to Consider

Before deploying, answer these:

1. **What's your target customer?**
   - Individual clubs → Lower price, focus on volume
   - Agencies → Higher price, BYOK essential

2. **What's your pricing model?**
   - Per club per month
   - Per agency with multiple clubs
   - Freemium with paid features

3. **AI cost strategy?**
   - Absorb AI costs (good for small scale)
   - BYOK required (good for scale)
   - Hybrid (free tier uses platform, paid uses BYOK)

4. **Expected growth rate?**
   - Slow (stay on MVP tier for 6+ months)
   - Fast (plan to upgrade in 3 months)

5. **Support requirements?**
   - Self-service (free tier OK)
   - Email support (Pro tier needed)
   - Phone/priority (Team tier)

---

**Last Updated:** December 17, 2024  
**Next Review:** Review costs after first 10 customers

---

*Remember: You can launch production-ready for ~$30-50/month and be profitable from your first 2-3 customers! 🚀*



