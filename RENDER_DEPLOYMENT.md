# Deploying SustainAlign on Render

This guide explains how to deploy the SustainAlign platform on Render using Docker.

## Prerequisites

1. A Render account ([https://render.com](https://render.com))
2. API keys for:
   - OpenRouter (for AI features)
   - IBM WatsonX Orchestrate (for AI agents)

## Deployment Options

### Option 1: Deploy Services Individually (Recommended)

This approach gives you more control over each service and is easier to debug.

#### 1. Deploy the Backend Service

1. Go to Render Dashboard → New Web Service
2. Connect your GitHub repository
3. Set the following:
   - Name: `sustainalign-backend`
   - Region: Choose your preference
   - Branch: `main` (or your preferred branch)
   - Root Directory: Leave empty
   - Environment: `Docker`
   - Dockerfile Path: `Dockerfile.backend`
   
4. Add Environment Variables:
   - `SECRET_KEY` - Generate a secure secret key
   - `OPENROUTER_API_KEY` - Your OpenRouter API key
   - `WO_API_KEY` - Your WatsonX Orchestrate API key
   - `WO_INSTANCE` - Your WatsonX instance
   - `WATSON_API_KEY` - Your WatsonX API key
   - `WATSON_SERVICE_URL` - Your WatsonX service URL
   - `FLASK_ENV` - `production`
   - `DATABASE_URL` - For production, consider using Render's PostgreSQL instead of SQLite

5. Click "Create Web Service"

#### 2. Deploy the Watson Service

1. Go to Render Dashboard → New Web Service
2. Connect your GitHub repository
3. Set the following:
   - Name: `sustainalign-watson`
   - Region: Same as backend for better performance
   - Branch: `main` (or your preferred branch)
   - Root Directory: Leave empty
   - Environment: `Docker`
   - Dockerfile Path: `Dockerfile.watson`
   
4. Add Environment Variables:
   - `WO_API_KEY` - Your WatsonX Orchestrate API key
   - `WO_INSTANCE` - Your WatsonX instance
   - `WATSON_API_KEY` - Your WatsonX API key
   - `WATSON_SERVICE_URL` - Your WatsonX service URL
   - `CALLBACK_HOST_URL` - The public URL of this service (will be available after deployment)

5. Click "Create Web Service"

#### 3. Deploy the Frontend Service

1. Go to Render Dashboard → New Static Site (or Web Service)
2. Connect your GitHub repository
3. For Static Site deployment:
   - Name: `sustainalign-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   
4. For Docker deployment:
   - Name: `sustainalign-frontend`
   - Region: Same as backend for better performance
   - Branch: `main` (or your preferred branch)
   - Root Directory: Leave empty
   - Environment: `Docker`
   - Dockerfile Path: `Dockerfile.frontend`
   
5. Add Environment Variables (if using Docker):
   - `NODE_ENV` - `production`

6. Set up Redirects/Rewrites for SPA:
   - Add a redirect: `/*` → `/index.html` (Status: 200)

7. Click "Create Static Site" or "Create Web Service"

### Option 2: Deploy Using Docker Compose

1. Fork this repository or ensure your repository has the [render-docker-compose.yml](file:///d:/projects/website/sustainalign/render-docker-compose.yml) file
2. Go to Render Dashboard → New Blueprint
3. Connect your GitHub repository
4. Select the [render-docker-compose.yml](file:///d:/projects/website/sustainalign/render-docker-compose.yml) file
5. Configure environment variables for each service as described above
6. Click "Apply"

## Post-Deployment Configuration

### Update Environment Variables

After deploying all services, you'll need to update some environment variables:

1. In the frontend service:
   - Update API calls to point to your backend service URL
   
2. In the backend service:
   - Update `CORS_ORIGIN` to match your frontend URL
   
3. In the Watson service:
   - Update `CALLBACK_HOST_URL` to match your Watson service URL

### Database Migration

If you want to use Render's PostgreSQL instead of SQLite:

1. Create a new Render PostgreSQL database
2. Update the backend service's `DATABASE_URL` environment variable
3. The application will automatically create tables on first run

## Monitoring and Maintenance

### Logs

You can monitor logs for each service from the Render dashboard:
- Backend: Contains Flask application logs
- Frontend: Contains Nginx access/error logs
- Watson: Contains WatsonX orchestration logs

### Scaling

Render automatically scales your services based on traffic. You can manually configure scaling from the Render dashboard.

### Updates

To update your application:
1. Push changes to your GitHub repository
2. Render will automatically redeploy (if auto-deploy is enabled)
3. Or manually trigger a deploy from the Render dashboard

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `CORS_ORIGIN` in the backend matches your frontend URL
2. **Watson Integration Failures**: Verify all Watson API keys and URLs are correct
3. **Database Connection Issues**: Check `DATABASE_URL` format and credentials
4. **Frontend Not Loading**: Check that the build completed successfully

### Checking Service Status

1. Visit each service's URL to verify it's running
2. Check `/api/health` endpoint on the backend service
3. Monitor logs for any error messages

## Support

For issues with deployment, please check:
1. Render's documentation: https://render.com/docs
2. This project's documentation in the [docs](file:///d:/projects/website/sustainalign/docs) directory
3. Docker configuration files in the root directory