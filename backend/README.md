# Learnex Backend

A TypeScript Node.js backend server for the Learnex application.

## Features

- Express.js web server
- TypeScript support
- Environment configuration
- API routing with controllers
- Error handling middleware
- Development tools (ESLint, Nodemon)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup

1. Install dependencies:

   ```
   npm install
   # or
   yarn install
   ```

2. Create an environment file:

   ```
   cp .env.example .env
   ```

3. Configure your `.env` file with your specific settings.

## Running the Server

### Development Mode

Run the server in development mode with hot reloading:

```
npm run dev
# or
yarn dev
```

The server will be available at http://localhost:5000

### Production Build

Build for production:

```
npm run build
# or
yarn build
```

Start the production server:

```
npm start
# or
yarn start
```

## Project Structure

```
backend/
├── dist/               # Compiled JavaScript files
├── src/                # TypeScript source files
│   ├── controllers/    # Request handlers
│   ├── routes/         # Route definitions
│   └── server.ts       # Main application entry
├── .env                # Environment variables
├── .env.example        # Example environment variables
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## API Endpoints

- `GET /` - Welcome message
- `GET /api/status` - API status check
