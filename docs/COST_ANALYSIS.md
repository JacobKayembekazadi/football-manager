# Fan Sentiment Tracking - Cost Analysis & Pricing Model

**Last Updated**: January 2025  
**Purpose**: Comprehensive cost analysis for Apify vs Twitter API and customer pricing strategy

---

## 📊 Service Pricing Overview

### 1. Apify Pricing (Twitter Scraper)

| Plan | Monthly Cost | Included Credits | Compute Units (CU) | Cost per CU | Best For |
|------|-------------|------------------|-------------------|-------------|----------|
| **Free** | $0 | $5 | 10,000 results | $0.40 | Testing |
| **Starter** | $39 | $39 | 100,000 results | $0.40 | Small clubs |
| **Team** | $149 | $149 | 1M results | $0.25 | Medium clubs |
| **Business** | $499 | $499 | 10M results | $0.20 | Large scale |

**CU Calculation**: 1 CU = 1 GB-hour of RAM usage  
**Overage**: If you exceed included credits, you pay per CU at the plan rate

### 2. Twitter API (X API) Pricing

| Tier | Monthly Cost | Tweets/Month | Rate Limits | Best For |
|------|-------------|--------------|-------------|----------|
| **Basic** | $200 | 15,000 | Limited | Small scale |
| **Pro** | $5,000 | 1,000,000 | High | Enterprise |

**Note**: Twitter API provides structured, reliable data but is significantly more expensive than Apify for basic sentiment tracking.

### 3. Other System Costs

#### Google Gemini API
- **Input**: $0.075 per 1M tokens
- **Output**: $0.30 per 1M tokens
- **Estimated cost**: ~$0.01-0.02 per sentiment analysis (analyzing 20-30 tweets)
- **Monthly cost**: ~$0.30-0.60 per club (daily analysis)

#### Supabase
- **Free Tier**: 2 Edge Function invocations/second
- **Pro Tier**: $25/month for higher limits
- **Estimated cost**: $0-25/month (usually covered in free tier for this use case)

---

## 💰 Cost Scenarios

### Scenario 1: Small Club (1-10 clubs)

**Usage**: 
- 1 sentiment refresh per club per day
- ~100 tweets analyzed per refresh
- 30 days/month = 3,000 sentiment analyses/month

#### Option A: Apify Starter Plan
- **Plan cost**: $39/month
- **Usage**: ~3,000 results/month (well within 100,000 limit)
- **Overage**: $0
- **Gemini cost**: ~$0.30-0.60/month
- **Supabase**: $0 (free tier)
- **Total**: **~$40/month**

#### Option B: Twitter API Basic Tier
- **Plan cost**: $200/month
- **Usage**: ~3,000 tweets/month (within 15,000 limit)
- **Gemini cost**: ~$0.30-0.60/month
- **Supabase**: $0
- **Total**: **~$201/month**

**Winner**: Apify (5x cheaper) ✅

---

### Scenario 2: Medium Club Portfolio (10-50 clubs)

**Usage**:
- 1 sentiment refresh per club per day
- ~100 tweets per refresh
- 50 clubs × 30 days = 1,500 sentiment analyses/month
- ~150,000 tweets analyzed/month

#### Option A: Apify Team Plan
- **Plan cost**: $149/month
- **Usage**: ~150,000 results/month (within 1M limit)
- **Overage**: $0
- **Gemini cost**: ~$15-30/month
- **Supabase**: $0-25/month
- **Total**: **~$164-204/month**

#### Option B: Twitter API Basic Tier
- **Plan cost**: $200/month
- **Usage**: ~150,000 tweets/month ❌ **EXCEEDS 15,000 limit**
- **Would need**: Pro Tier ($5,000/month)
- **Gemini cost**: ~$15-30/month
- **Total**: **~$5,015/month** ❌

**Winner**: Apify (30x cheaper) ✅

---

### Scenario 3: Large Enterprise (50+ clubs)

**Usage**:
- 100 clubs × 30 days = 3,000 analyses/month
- ~300,000 tweets analyzed/month

#### Option A: Apify Business Plan
- **Plan cost**: $499/month
- **Usage**: ~300,000 results/month (within 10M limit)
- **Overage**: $0
- **Gemini cost**: ~$90-180/month
- **Supabase Pro**: $25/month
- **Total**: **~$614-704/month**

#### Option B: Twitter API Pro Tier
- **Plan cost**: $5,000/month
- **Usage**: ~300,000 tweets/month (within 1M limit)
- **Gemini cost**: ~$90-180/month
- **Supabase Pro**: $25/month
- **Total**: **~$5,115/month** ❌

**Winner**: Apify (7x cheaper) ✅

---

## 🎯 Recommendation: Use Apify

**Why Apify wins:**
1. ✅ **5-30x cheaper** than Twitter API
2. ✅ **More flexible** - pay for what you use
3. ✅ **No rate limits** on data collection
4. ✅ **Works for all scales** - from free tier to enterprise
5. ✅ **No approval needed** - instant access

**Why not Twitter API:**
1. ❌ **Too expensive** - $200 minimum even for small usage
2. ❌ **Strict limits** - 15,000 tweets/month on Basic tier
3. ❌ **Requires approval** - Basic tier needs application
4. ❌ **Pro tier** is $5,000/month (overkill for sentiment)

---

## 💵 Customer Pricing Strategy

### Pricing Tiers

Based on your costs and value provided, here's a recommended pricing model:

#### Tier 1: Starter (1-5 clubs)
**Features**:
- Daily sentiment tracking
- Historical sentiment data (30 days)
- Dashboard widget
- Manual refresh button

**Your Cost**: ~$40/month (Apify Starter + Gemini)
**Customer Price**: **$99/month** 
**Profit Margin**: 148% | $59 profit

---

#### Tier 2: Professional (6-25 clubs)
**Features**:
- Everything in Starter
- Extended history (90 days)
- Automated daily refreshes
- Email alerts for sentiment drops
- API access

**Your Cost**: ~$150/month (Apify Team + Gemini)
**Customer Price**: **$299/month**
**Profit Margin**: 99% | $149 profit

---

#### Tier 3: Enterprise (26-100 clubs)
**Features**:
- Everything in Professional
- Unlimited history
- Custom sentiment keywords
- Multi-club analytics dashboard
- Priority support
- White-label option

**Your Cost**: ~$500/month (Apify Business + Gemini)
**Customer Price**: **$999/month**
**Profit Margin**: 100% | $499 profit

---

#### Tier 4: Agency (100+ clubs)
**Features**:
- Everything in Enterprise
- Unlimited clubs
- Dedicated account manager
- Custom integrations
- SLA guarantee

**Your Cost**: ~$700/month (scaled Apify + Gemini)
**Customer Price**: **$1,999/month**
**Profit Margin**: 186% | $1,299 profit

---

## 📈 Monthly Cost Breakdown (Example: 20 clubs)

### Using Apify (Recommended)

| Service | Cost | Notes |
|---------|------|-------|
| Apify Team Plan | $149 | 1M results/month (plenty) |
| Gemini API | $15 | ~500 analyses × $0.03 |
| Supabase (Pro) | $25 | Optional, for higher limits |
| **Total Cost** | **$189** | |

**Customer Price**: $299/month  
**Profit**: $110/month (58% margin)

---

### Using Twitter API (Not Recommended)

| Service | Cost | Notes |
|---------|------|-------|
| Twitter API Pro | $5,000 | Required for 20 clubs |
| Gemini API | $15 | Same usage |
| Supabase (Pro) | $25 | Same |
| **Total Cost** | **$5,040** | ❌ Too expensive |

**Customer Price**: Would need to charge $10,000+/month (uncompetitive)

---

## 🎯 Final Recommendation

### Use Apify for Sentiment Tracking

**Rationale**:
1. **Cost-effective**: $40-700/month vs $200-5,000/month
2. **Scalable**: Works from free tier to enterprise
3. **Flexible**: Pay for what you use
4. **No approval needed**: Instant access
5. **Better margins**: Higher profit potential

### Customer Pricing Model

| Tier | Clubs | Your Cost | Customer Price | Margin |
|------|-------|-----------|----------------|--------|
| Starter | 1-5 | $40 | $99 | 148% |
| Professional | 6-25 | $150 | $299 | 99% |
| Enterprise | 26-100 | $500 | $999 | 100% |
| Agency | 100+ | $700 | $1,999 | 186% |

---

## 📊 Cost Monitoring

### Track These Metrics:
1. **Apify usage**: Monitor CU consumption monthly
2. **Gemini API usage**: Track token usage in Google Cloud Console
3. **Supabase usage**: Monitor Edge Function invocations
4. **Customer count**: Track per tier to calculate costs

### Set Up Alerts:
- When Apify usage exceeds 80% of plan limit
- When monthly costs exceed budget threshold
- When customer count triggers tier upgrade

---

## 💡 Cost Optimization Tips

1. **Start Small**: Begin with Apify Starter ($39) and scale up
2. **Optimize Gemini**: Reduce sample size if needed (20-30 tweets is already optimized)
3. **Batch Processing**: Group sentiment refreshes to reduce Edge Function calls
4. **Monitor Usage**: Use Apify dashboard to track consumption
5. **Plan Upgrades**: Upgrade Apify plan before hitting limits (avoids overage)

---

## 🚀 Scaling Strategy

### Growth Path:
1. **0-10 clubs**: Apify Starter ($39) → Customer: $99/month
2. **11-50 clubs**: Apify Team ($149) → Customer: $299/month
3. **51-100 clubs**: Apify Business ($499) → Customer: $999/month
4. **100+ clubs**: Apify Business + Optimizations → Customer: $1,999/month

---

## 📋 Summary

**Best Choice**: **Apify** for sentiment tracking
- Cost: $40-700/month (scales with usage)
- Customer Pricing: $99-1,999/month (58-186% margins)
- Twitter API: Too expensive ($200-5,000/month)

**Start with**: Apify Starter ($39/month) for testing and initial customers  
**Scale to**: Apify Team/Business as you grow

**Customer Pricing**: Tiered model from $99-1,999/month based on club count and features

---

**Bottom Line**: Apify provides the best cost-to-value ratio and allows you to offer competitive pricing with healthy profit margins. 🎯


