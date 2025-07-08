# 🚀 Deployment Guide

This guide will help you deploy your Musix Player to production using Vercel.

## 📋 Prerequisites

- [Vercel Account](https://vercel.com) (free tier available)
- [GitHub Account](https://github.com)
- YouTube Data API v3 Key
- Project pushed to GitHub repository

## 🔧 Pre-Deployment Setup

### 1. Environment Variables Setup

#### Backend Environment Variables

Create these in your Vercel dashboard for the backend project:

```env
YOUTUBE_API_KEY=your_actual_youtube_api_key_here
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

#### Frontend Environment Variables

Create these in your Vercel dashboard for the frontend project:

```env
REACT_APP_API_URL=https://your-backend-domain.vercel.app
```

### 2. Update CORS Configuration

In your `server/index.js`, update the CORS origin array:

```javascript
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://your-frontend-domain.vercel.app",
      "http://localhost:3000", // Keep for local development
    ],
    // ... rest of CORS config
  })
);
```

## 🚀 Deployment Steps

### Step 1: Deploy Backend API

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Deploy Backend**

   ```bash
   cd server
   vercel
   ```

3. **Configure Environment Variables**

   - Go to Vercel Dashboard
   - Select your backend project
   - Go to Settings → Environment Variables
   - Add all the backend environment variables

4. **Get Backend URL**
   - Copy the deployment URL (e.g., `https://your-backend.vercel.app`)

### Step 2: Deploy Frontend

1. **Update Frontend Environment**

   ```bash
   cd musix-player
   # Create .env.production.local
   echo "REACT_APP_API_URL=https://your-backend.vercel.app" > .env.production.local
   ```

2. **Deploy Frontend**

   ```bash
   vercel
   ```

3. **Configure Environment Variables**

   - Go to Vercel Dashboard
   - Select your frontend project
   - Go to Settings → Environment Variables
   - Add the frontend environment variables

4. **Get Frontend URL**
   - Copy the deployment URL (e.g., `https://your-frontend.vercel.app`)

### Step 3: Update Backend CORS

1. **Update Backend Environment**
   - Go to backend project in Vercel Dashboard
   - Update `FRONTEND_URL` to your actual frontend URL
   - Redeploy backend

## 🔒 Security Checklist

- [ ] API keys are in environment variables, not code
- [ ] `.env` files are in `.gitignore`
- [ ] CORS is properly configured
- [ ] No sensitive data in repository
- [ ] Environment variables are set in Vercel dashboard

## 🧪 Testing Deployment

### 1. Test Backend API

```bash
# Test search endpoint
curl "https://your-backend.vercel.app/search?query=test"

# Should return JSON response
```

### 2. Test Frontend

- Visit your frontend URL
- Try searching for a song
- Check browser console for errors
- Test audio playback

### 3. Test CORS

- Open browser developer tools
- Check for CORS errors in console
- Verify API calls are successful

## 🐛 Common Issues & Solutions

### Issue: CORS Error

**Solution:**

- Check environment variables in Vercel dashboard
- Verify FRONTEND_URL in backend environment
- Ensure CORS origins include your frontend domain

### Issue: API Key Error

**Solution:**

- Verify YouTube API key is correct
- Check API key permissions in Google Cloud Console
- Ensure YOUTUBE_API_KEY is set in backend environment

### Issue: Build Failure

**Solution:**

- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Ensure TypeScript types are correct

### Issue: Audio Not Playing

**Solution:**

- Check if yt-dlp is working (may need custom setup for serverless)
- Verify file permissions
- Check audio URL endpoints

## 📱 Custom Domain (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Domains
4. Add your custom domain
5. Update DNS records as instructed

### Update Environment Variables

After adding custom domain, update:

- Backend: `FRONTEND_URL` to your custom domain
- Frontend: `REACT_APP_API_URL` to backend custom domain

## 🔄 Continuous Deployment

### Automatic Deployment

- Push changes to GitHub
- Vercel automatically deploys
- No manual intervention required

### Manual Deployment

```bash
# Force redeploy
vercel --prod
```

## 📊 Monitoring

### Vercel Analytics

- Enable analytics in Vercel dashboard
- Monitor performance and errors
- Track user engagement

### Error Tracking

- Check Vercel function logs
- Monitor API endpoint responses
- Set up alerts for failures

## 🎯 Performance Optimization

### Frontend Optimization

- Enable Vercel Analytics
- Use Vercel's Edge Network
- Optimize bundle size

### Backend Optimization

- Use Vercel Edge Functions
- Implement caching strategies
- Monitor function execution time

## 🛠️ Maintenance

### Regular Updates

- Update dependencies monthly
- Monitor for security vulnerabilities
- Update YouTube API if needed

### Backup Strategy

- Keep environment variables documented
- Maintain local development setup
- Regular testing of deployment process

## 🎉 Success!

Your Musix Player is now deployed! Share your URLs:

- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.vercel.app`

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Review browser console errors
3. Verify environment variables
4. Test locally first

Happy deploying! 🚀
