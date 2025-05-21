# Polarize Poker - Tournament Tracker

## Overview

Polarize Poker is a web application for tracking and analyzing poker tournament results. The application allows users to upload tournament summary files from GGNetwork, automatically parses the data, calculates various financial distributions (normal deal and automatic sale), and provides a comprehensive summary of tournament performance.

Preferred communication style: Simple, everyday language.

## User Preferences

- Terminology: Use poker and financial terminology that players would understand
- Error Handling: Provide clear, actionable error messages
- Data Format: Display monetary values with two decimal places prefixed with $ 
- Responsive Design: Ensure all components work well on both desktop and mobile

## System Architecture

This is a full-stack TypeScript application using the following high-level architecture:

1. **Frontend**: React with TypeScript, using Tailwind CSS for styling and shadcn/ui component library
2. **Backend**: Express.js server running on Node.js
3. **Database**: PostgreSQL (using Drizzle ORM for database operations)
4. **State Management**: React Query for server state, React hooks for client state
5. **Routing**: Wouter for client-side routing

The application follows a REST API pattern for communication between the frontend and backend.

## Key Components

### Frontend Components

1. **Pages**:
   - `Home.tsx`: Main page with file upload and results display
   - `History.tsx`: History of previous tournament uploads
   - `NotFound.tsx`: 404 page

2. **Layout Components**:
   - `Layout.tsx`: Main layout with navigation
   - `EmptyState.tsx`: Placeholder for when no results are available
   - `ProcessingState.tsx`: Loading state for file processing
   - `PlayerLevelCard.tsx`: Shows player's current level and limits
   - `ResultsPanel.tsx`: Displays tournament results
   - `TournamentTable.tsx`: Table showing tournament details

3. **UI Components**:
   - Extensive library of UI components from shadcn/ui (buttons, cards, dropdowns, etc.)

### Backend Services

1. **Tournament Parser**:
   - `tournamentParser.ts`: Parses text files containing tournament results
   - `calculateDistributions()`: Calculates normal deal and automatic sale

2. **Currency Converter**:
   - `currencyConverter.ts`: Converts amounts from different currencies to USD

3. **Polarize Integration**:
   - `polarizeService.ts`: Communicates with the Polarize tracking API

4. **Data Storage**:
   - `schema.ts`: Defines database schema using Drizzle ORM

## Data Flow

1. **Tournament Upload Flow**:
   - User uploads tournament summary text files
   - Backend parses the files to extract tournament data
   - System categorizes tournaments (Phase Day 1, Phase Day 2+, etc.)
   - For non-USD currencies, amounts are converted to USD
   - System calculates financial distributions based on player level
   - Results are stored in the database and displayed to the user

2. **Player Level Flow**:
   - System retrieves player level data from the Polarize API
   - Player level determines the limits for tournament distributions
   - System displays current level progress and limits

## External Dependencies

1. **API Integrations**:
   - Polarize API for player levels and submitting results
   - Currency conversion API for handling different currencies

2. **Key Libraries**:
   - React and React DOM for UI rendering
   - TanStack Query (React Query) for data fetching
   - Wouter for routing
   - Tailwind CSS and shadcn/ui for styling
   - Drizzle ORM for database operations

## Deployment Strategy

The application is configured for deployment on Replit with:

1. **Build Process**:
   - Frontend: Vite builds the React application
   - Backend: esbuild bundles the server code

2. **Runtime Configuration**:
   - Node.js 20 for running the server
   - PostgreSQL 16 for the database
   - Web module for serving the application

3. **Environment Variables**:
   - `DATABASE_URL`: Connection string for PostgreSQL
   - `NODE_ENV`: Environment mode (development/production)

## Database Schema

The database schema includes:

1. **Users Table**:
   - `id`: Serial primary key
   - `username`: Unique username
   - `password`: Password (should be hashed in implementation)

2. **Tournaments Table**:
   - `id`: Serial primary key
   - `userId`: Foreign key to users
   - `name`: Tournament name
   - `category`: Tournament category (PHASE_DAY_1, PHASE_DAY_2_PLUS, etc.)
   - `tournamentId`: Optional ID from the poker platform
   - `buyIn`: Buy-in amount in USD
   - `buyInOriginal`: Original buy-in amount with currency
   - `result`: Tournament result (profit/loss)
   - `normalDeal`: Calculated normal deal amount
   - `automaticSale`: Calculated automatic sale amount
   - `currencyCode`: Currency code (default: USD)
   - `conversionRate`: Currency conversion rate
   - `uploadBatchId`: ID for grouping uploaded tournaments
   - `originalFilename`: Original filename
   - `createdAt`: Timestamp

The application uses Drizzle ORM to define and interact with these schemas, providing a typesafe way to perform database operations.