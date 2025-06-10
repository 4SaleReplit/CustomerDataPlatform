# Amplitude Analytics Integration

## Overview
Your project now includes Amplitude Analytics JavaScript SDK with comprehensive event tracking for user behavior analysis.

## Setup Instructions

### 1. Get Your Amplitude API Key
1. Sign up or log in to [Amplitude](https://amplitude.com)
2. Create a new project or select existing one
3. Go to Settings > Projects > [Your Project] > General
4. Copy your API Key

### 2. Configure Environment Variables
Add your Amplitude API key to your `.env` file:
```
VITE_AMPLITUDE_API_KEY=your-amplitude-api-key-here
```

## Features Implemented

### Automatic Tracking
- **Page Views**: Automatically tracks all page navigation
- **Sessions**: Tracks user sessions and engagement time
- **Form Interactions**: Tracks form submissions and interactions
- **Element Interactions**: Tracks button clicks and UI interactions

### Business Event Tracking
The following business events are automatically tracked:

#### Segment Management
- `Segment Created` - When users create new behavioral tags
- `Segment Refreshed` - When user counts are recalculated

#### Dashboard Analytics
- `Dashboard Tile Created` - When new tiles are added
- `Dashboard Tile Refreshed` - When tile data is refreshed

#### Cohort Management
- `Cohort Created` - When new cohorts are built
- `Cohort Refreshed` - When cohort user counts are updated
- `Cohort Synced to Amplitude` - When cohorts are pushed to Amplitude
- `Cohort Synced to Braze` - When cohorts are pushed to Braze

#### Data Exploration
- `Snowflake Query Executed` - Tracks query performance and success rates
- `User Profile Viewed` - Tracks user detail page visits
- `Users List Filtered` - Tracks filtering and search behavior
- `Data Exported` - Tracks data export usage

## Event Properties
Each event includes relevant context:
- User identifiers and properties
- Timestamp and session information
- Feature-specific metadata (cohort size, query type, etc.)
- Performance metrics (execution time, success/failure)

## Analytics Dashboard
Once configured, you can view analytics in your Amplitude dashboard:
- User engagement and retention
- Feature adoption rates
- Performance metrics
- User journey analysis

## Testing
After adding your API key, test the integration:
1. Create a new segment tag
2. Refresh a segment's user count
3. Navigate between pages
4. Check your Amplitude dashboard for events

## Privacy & Compliance
- No sensitive user data is tracked
- Only behavioral and usage analytics
- Compliant with standard privacy practices