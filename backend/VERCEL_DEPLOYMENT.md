# Deploying Learnex Backend to Vercel

This guide explains how to deploy the Learnex backend to Vercel as a serverless Node.js application.

## Prerequisites

- A Vercel account
- Vercel CLI installed globally: `npm install -g vercel`

## Local Testing

Before deploying to Vercel, test your application locally:

1. **Development mode**:

   ```
   npm run dev
   ```

2. **Production mode simulation**:
   ```
   npm run prod-test
   ```
   This simulates how your app will run on Vercel by setting the NODE_ENV to production.

## Deployment Steps

1. **Login to Vercel CLI**

   ```
   vercel login
   ```

2. **Deploy from the backend directory**

   ```
   cd backend
   vercel
   ```

3. **Follow the interactive prompts:**

   - Confirm the directory to deploy (should be the current directory)
   - Link to an existing project or create a new one
   - Confirm deployment settings

4. **For production deployments:**
   ```
   vercel --prod
   ```

## Environment Variables

Make sure to set up all required environment variables from your `.env` file in the Vercel project settings:

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to Settings > Environment Variables
4. Add all the environment variables from your `.env` file

**Important**: Vercel automatically sets `NODE_ENV=production` in the production environment.

## Troubleshooting

- If you encounter build errors, check the Vercel logs for details
- Ensure all dependencies are correctly listed in `package.json`
- Verify that the `api/index.ts` entry point is correctly importing the app
- If API routes aren't working, check your vercel.json configuration

## Project Structure

- `api/index.ts` - Vercel serverless entry point
- `vercel.json` - Vercel deployment configuration
- `src/server.ts` - Main Express application
