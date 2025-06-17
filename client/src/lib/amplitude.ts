import * as amplitude from '@amplitude/analytics-browser';

// Amplitude configuration
/**
 * Clean Amplitude Analytics Implementation
 * Following comprehensive event naming convention with Title Case events
 * and camelCase properties for consistency and clarity
 */

// Initialize Amplitude with credentials from database integration
export const initializeAmplitude = async () => {
  try {
    const response = await fetch('/api/amplitude/config');
    if (!response.ok) {
      console.warn('Amplitude integration not configured. Analytics tracking disabled.');
      return;
    }
    
    const config = await response.json();
    if (config.apiKey) {
      amplitude.init(config.apiKey, undefined, {
        defaultTracking: false, // Disable all default tracking
        autocapture: false, // Disable all autocapture
      });
      console.log('Amplitude initialized successfully');
    } else {
      console.warn('Amplitude API key not found in integration. Analytics tracking disabled.');
    }
  } catch (error) {
    console.warn('Failed to initialize Amplitude from database integration:', error);
  }
};

// Store current user properties for inclusion in all events
let currentUserProperties: {
  user_name?: string;
  user_email?: string;
  user_type?: string;
} = {};

// Set user context after login - called once and persists for session
export const setUserContext = (userId: string, userProperties: {
  email?: string;
  name?: string;
  userType?: string;
  role?: string;
}) => {
  if (AMPLITUDE_API_KEY) {
    amplitude.setUserId(userId);
    
    const identify = new amplitude.Identify();
    Object.entries(userProperties).forEach(([key, value]) => {
      if (value) identify.set(key, value);
    });
    amplitude.identify(identify);
    
    // Store user properties for inclusion in all events
    currentUserProperties = {
      user_name: userProperties.name,
      user_email: userProperties.email,
      user_type: userProperties.userType || userProperties.role,
    };
    
    console.log('User context set:', userId, currentUserProperties);
  }
};

// Clear user context on logout
export const clearUserContext = () => {
  amplitude.setUserId(undefined);
  amplitude.reset();
};

// Check if Amplitude is initialized
let isAmplitudeInitialized = false;

// Core event tracking function following Title Case + camelCase convention
const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  if (isAmplitudeInitialized) {
    // Merge user properties with event properties
    const enrichedProperties = {
      ...currentUserProperties,
      ...eventProperties
    };
    
    amplitude.track(eventName, enrichedProperties);
    console.log('Amplitude event tracked:', eventName, enrichedProperties);
  }
};

/**
 * Analytics Event Library
 * Following convention: [Component/Screen + Action] in Title Case
 * Properties in camelCase with descriptive context
 */
export const analytics = {
  // Screen/Page Navigation Events
  screenViewed: (screenName: string, additionalProperties?: Record<string, any>) => {
    trackEvent(`${screenName} Screen Viewed`, {
      screenName,
      ...additionalProperties
    });
  },

  // Button Click Events
  buttonClicked: (buttonName: string, screenName: string, additionalProperties?: Record<string, any>) => {
    trackEvent(`${buttonName} Button Clicked`, {
      buttonName,
      screenName,
      ...additionalProperties
    });
  },

  // Form Events
  formSubmitted: (formName: string, screenName: string, success: boolean, additionalProperties?: Record<string, any>) => {
    trackEvent(`${formName} Form Submitted`, {
      formName,
      screenName,
      success,
      ...additionalProperties
    });
  },

  // Navigation Events
  navigationItemClicked: (itemName: string, sourceScreen: string, destinationScreen?: string) => {
    trackEvent('Navigation Item Clicked', {
      itemName,
      sourceScreen,
      destinationScreen
    });
  },

  // Dashboard Events
  dashboardTileCreated: (tileType: string, dataSource: string, screenName: string = 'Dashboard') => {
    trackEvent('Dashboard Tile Created', {
      tileType,
      dataSource,
      screenName
    });
  },

  dashboardTileRefreshed: (tileId: string, tileType: string, screenName: string = 'Dashboard') => {
    trackEvent('Dashboard Tile Refreshed', {
      tileId,
      tileType,
      screenName
    });
  },

  dashboardGlobalRefreshed: (tileCount: number, screenName: string = 'Dashboard') => {
    trackEvent('Dashboard Global Refreshed', {
      tileCount,
      screenName
    });
  },

  // Integration Events
  integrationTestClicked: (integrationType: string, integrationName: string, screenName: string = 'Integrations') => {
    trackEvent('Integration Test Clicked', {
      integrationType,
      integrationName,
      screenName
    });
  },

  integrationTestCompleted: (integrationType: string, integrationName: string, success: boolean, errorMessage?: string) => {
    trackEvent('Integration Test Completed', {
      integrationType,
      integrationName,
      success,
      errorMessage
    });
  },

  integrationConfigOpened: (integrationType: string, integrationName: string, screenName: string = 'Integrations') => {
    trackEvent('Integration Config Opened', {
      integrationType,
      integrationName,
      screenName
    });
  },

  integrationConfigSaved: (integrationType: string, integrationName: string, configFields: string[]) => {
    trackEvent('Integration Config Saved', {
      integrationType,
      integrationName,
      configFieldsCount: configFields.length
    });
  },

  // Cohort Management Events
  cohortCreated: (cohortName: string, conditionsCount: number, screenName: string = 'Cohorts') => {
    trackEvent('Cohort Created', {
      cohortName,
      conditionsCount,
      screenName
    });
  },

  cohortRefreshed: (cohortId: string, cohortName: string, userCount: number) => {
    trackEvent('Cohort Refreshed', {
      cohortId,
      cohortName,
      userCount
    });
  },

  cohortSynced: (cohortId: string, cohortName: string, platform: 'Amplitude' | 'Braze', userCount: number) => {
    trackEvent('Cohort Synced', {
      cohortId,
      cohortName,
      platform,
      userCount
    });
  },

  cohortDeleted: (cohortId: string, cohortName: string, userCount: number) => {
    trackEvent('Cohort Deleted', {
      cohortId,
      cohortName,
      userCount
    });
  },

  // Segment Management Events
  segmentCreated: (segmentName: string, attribute: string, operator: string, screenName: string = 'Segments') => {
    trackEvent('Segment Created', {
      segmentName,
      attribute,
      operator,
      screenName
    });
  },

  segmentRefreshed: (segmentId: string, segmentName: string, userCount: number) => {
    trackEvent('Segment Refreshed', {
      segmentId,
      segmentName,
      userCount
    });
  },

  // Query Execution Events
  queryExecuted: (queryType: 'Snowflake' | 'PostgreSQL', success: boolean, executionTimeMs?: number, errorMessage?: string) => {
    trackEvent('Query Executed', {
      queryType,
      success,
      executionTimeMs,
      errorMessage
    });
  },

  // Data Export Events
  dataExported: (exportType: 'PDF' | 'Excel' | 'CSV', recordCount: number, screenName: string) => {
    trackEvent('Data Exported', {
      exportType,
      recordCount,
      screenName
    });
  },

  // Search and Filter Events
  searchExecuted: (searchTerm: string, resultCount: number, screenName: string) => {
    trackEvent('Search Executed', {
      searchTerm,
      resultCount,
      screenName
    });
  },

  filterApplied: (filterType: string, filterValue: string, screenName: string) => {
    trackEvent('Filter Applied', {
      filterType,
      filterValue,
      screenName
    });
  },

  // Modal and Dialog Events
  modalOpened: (modalName: string, sourceScreen: string) => {
    trackEvent('Modal Opened', {
      modalName,
      sourceScreen
    });
  },

  modalClosed: (modalName: string, sourceScreen: string, completedAction?: string) => {
    trackEvent('Modal Closed', {
      modalName,
      sourceScreen,
      completedAction
    });
  },

  // Error Events
  errorOccurred: (errorType: string, errorMessage: string, screenName: string) => {
    trackEvent('Error Occurred', {
      errorType,
      errorMessage,
      screenName
    });
  },

  // User Profile Events
  userProfileViewed: (userId: string, tabName: string, screenName: string = 'User Profile') => {
    trackEvent('User Profile Viewed', {
      userId,
      tabName,
      screenName
    });
  },

  // Table Interaction Events
  tableRowClicked: (tableName: string, rowId: string, screenName: string) => {
    trackEvent('Table Row Clicked', {
      tableName,
      rowId,
      screenName
    });
  },

  tableSorted: (tableName: string, sortColumn: string, sortDirection: 'asc' | 'desc', screenName: string) => {
    trackEvent('Table Sorted', {
      tableName,
      sortColumn,
      sortDirection,
      screenName
    });
  },

  // Campaign Events
  campaignCreated: (campaignName: string, campaignType: string, screenName: string = 'Campaigns') => {
    trackEvent('Campaign Created', {
      campaignName,
      campaignType,
      screenName
    });
  },

  campaignLaunched: (campaignId: string, campaignName: string, targetUserCount: number) => {
    trackEvent('Campaign Launched', {
      campaignId,
      campaignName,
      targetUserCount
    });
  }
};

export default amplitude;