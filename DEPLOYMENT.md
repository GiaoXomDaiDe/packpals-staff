# PackPals Staff Dashboard Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- [Vercel CLI](https://vercel.com/cli) installed: `npm i -g vercel`
- Node.js 18+ installed
- Git repository connected to Vercel

### Step 1: Environment Variables Setup

1. **Local Environment (.env)**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Vercel Environment Variables**
   Go to your Vercel dashboard → Project Settings → Environment Variables
   
   Add these variables:
   ```
   VITE_API_BASE_URL=https://packpal-api.up.railway.app/api
   VITE_NODE_ENV=production
   VITE_TOKEN_KEY=staff_token
   VITE_USER_DATA_KEY=staff_user
   VITE_API_TIMEOUT=30000
   VITE_LOGIN_TIMEOUT=15000
   VITE_SIGNALR_URL=https://packpal-api.up.railway.app/signalrhub
   ```

### Step 2: Deploy Methods

#### Method A: Vercel CLI (Recommended)
```bash
# Navigate to project directory
cd PackPals-FE-Staff/PackpalsStaff

# Install dependencies
npm install

# Build and test locally
npm run build
npm run preview

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Method B: Git Integration
1. Push your code to GitHub/GitLab
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### Step 3: Verify Deployment

1. **Check Build Logs**
   - Ensure all environment variables are loaded
   - Verify no build errors

2. **Test Functionality**
   - Login functionality
   - API connections
   - SignalR real-time features
   - Toast notifications

### Step 4: Domain & SSL
- Vercel provides HTTPS by default
- Add custom domain if needed: `vercel domains add yourdomain.com`

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://packpal-api.up.railway.app/api` |
| `VITE_SIGNALR_URL` | SignalR Hub URL | `https://packpal-api.up.railway.app/signalrhub` |
| `VITE_NODE_ENV` | Environment mode | `production` |
| `VITE_TOKEN_KEY` | LocalStorage key for auth token | `staff_token` |
| `VITE_USER_DATA_KEY` | LocalStorage key for user data | `staff_user` |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `30000` |
| `VITE_LOGIN_TIMEOUT` | Login request timeout (ms) | `15000` |

## 🛠️ Build Configuration

- **Framework**: Vite + React + TypeScript
- **Output Directory**: `dist/`
- **Build Command**: `npm run build`
- **Dev Command**: `npm run dev`
- **Preview Command**: `npm run preview`

## 📋 Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] `.env` file in `.gitignore`
- [ ] Build runs successfully (`npm run build`)
- [ ] Preview works locally (`npm run preview`)
- [ ] API endpoints are accessible
- [ ] CORS settings allow frontend domain
- [ ] SignalR connection works
- [ ] All routes handle SPA properly

## 🔍 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Loading
- Ensure variables start with `VITE_`
- Check Vercel dashboard settings
- Redeploy after adding variables

### CORS Issues
- Verify backend CORS settings
- Check API base URL in environment variables

### SignalR Connection Issues
- Verify SignalR hub URL
- Check network policies
- Ensure HTTPS for production

## 🌐 Live URLs

- **Production**: `https://your-project.vercel.app`
- **Preview**: `https://your-project-git-branch.vercel.app`

## 📞 Support

For deployment issues, check:
1. Vercel build logs
2. Browser console errors
3. Network tab for API calls
4. Environment variables in Vercel dashboard
