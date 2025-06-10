import * as amplitude from '@amplitude/analytics-browser';

// Amplitude configuration
const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;

// Initialize Amplitude
export const initializeAmplitude = () => {
  if (AMPLITUDE_API_KEY) {
    amplitude.init(AMPLITUDE_API_KEY, undefined, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: true,
        fileDownloads: true,
      },
      autocapture: {
        elementInteractions: true,
      },
    });
    console.log('Amplitude initialized successfully');
  } else {
    console.warn('Amplitude API key not found. Analytics tracking disabled.');
  }
};

// Track custom events with user context
export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  if (AMPLITUDE_API_KEY) {
    // Get current user from localStorage to enrich events
    const storedUser = localStorage.getItem('platform_user');
    let userContext = {};
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userContext = {
          platform_user_id: user.id,
          platform_username: user.username,
          platform_user_role: user.role,
          platform: 'CDP'
        };
      } catch (error) {
        console.warn('Failed to parse user context for tracking:', error);
      }
    }
    
    // Merge user context with event properties
    const enrichedProperties = {
      ...userContext,
      ...eventProperties,
      timestamp: new Date().toISOString()
    };
    
    amplitude.track(eventName, enrichedProperties);
    console.log('Amplitude event tracked:', eventName, enrichedProperties);
  }
};

// Identify user
export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  if (AMPLITUDE_API_KEY) {
    amplitude.setUserId(userId);
    if (userProperties) {
      const identify = new amplitude.Identify();
      Object.entries(userProperties).forEach(([key, value]) => {
        identify.set(key, value);
      });
      amplitude.identify(identify);
    }
  }
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (AMPLITUDE_API_KEY) {
    const identify = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value);
    });
    amplitude.identify(identify);
  }
};

// Track page views manually if needed
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  if (AMPLITUDE_API_KEY) {
    amplitude.track('Page View', {
      page_name: pageName,
      ...properties
    });
  }
};

// Track business events
export const trackBusinessEvent = {
  // Dashboard interactions
  dashboardTileCreated: (tileType: string, dataSource: string) => {
    trackEvent('Dashboard Tile Created', {
      tile_type: tileType,
      data_source: dataSource,
    });
  },
  
  dashboardTileRefreshed: (tileId: string, tileType: string) => {
    trackEvent('Dashboard Tile Refreshed', {
      tile_id: tileId,
      tile_type: tileType,
    });
  },

  dashboardGlobalRefresh: (tileCount: number) => {
    trackEvent('Dashboard Global Refresh', {
      tile_count: tileCount,
    });
  },

  // Cohort management
  cohortCreated: (cohortName: string, conditionsCount: number) => {
    trackEvent('Cohort Created', {
      cohort_name: cohortName,
      conditions_count: conditionsCount,
    });
  },

  cohortRefreshed: (cohortId: string, userCount: number) => {
    trackEvent('Cohort Refreshed', {
      cohort_id: cohortId,
      user_count: userCount,
    });
  },

  cohortDeleted: (cohortName: string) => {
    trackEvent('Cohort Deleted', {
      cohort_name: cohortName,
    });
  },

  cohortSyncedToAmplitude: (cohortId: string, userCount: number) => {
    trackEvent('Cohort Synced to Amplitude', {
      cohort_id: cohortId,
      user_count: userCount,
    });
  },

  cohortSyncedToBraze: (cohortId: string, userCount: number) => {
    trackEvent('Cohort Synced to Braze', {
      cohort_id: cohortId,
      user_count: userCount,
    });
  },

  // Segment management
  segmentCreated: (segmentName: string, attribute: string, operator: string) => {
    trackEvent('Segment Created', {
      segment_name: segmentName,
      attribute,
      operator,
    });
  },

  segmentRefreshed: (segmentId: string, userCount: number) => {
    trackEvent('Segment Refreshed', {
      segment_id: segmentId,
      user_count: userCount,
    });
  },

  // Snowflake queries
  snowflakeQueryExecuted: (queryType: string, success: boolean, executionTime?: number) => {
    trackEvent('Snowflake Query Executed', {
      query_type: queryType,
      success,
      execution_time_ms: executionTime,
    });
  },

  // User exploration
  userProfileViewed: (userId: string, tabName: string) => {
    trackEvent('User Profile Viewed', {
      user_id: userId,
      tab_name: tabName,
    });
  },

  usersListFiltered: (filterType: string, filterValue: string) => {
    trackEvent('Users List Filtered', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  },

  userDataRefreshed: (userCount: number) => {
    trackEvent('User Data Refreshed', {
      user_count: userCount,
    });
  },

  // Data exploration
  dataTableSorted: (tableName: string, sortColumn: string, sortDirection: string) => {
    trackEvent('Data Table Sorted', {
      table_name: tableName,
      sort_column: sortColumn,
      sort_direction: sortDirection,
    });
  },

  dataExported: (exportType: string, recordCount: number) => {
    trackEvent('Data Exported', {
      export_type: exportType,
      record_count: recordCount,
    });
  },

  // Page navigation
  pageViewed: (pageName: string) => {
    trackEvent('Page Viewed', {
      page_name: pageName,
    });
  },

  navigationItemClicked: (itemName: string) => {
    trackEvent('Navigation Item Clicked', {
      item_name: itemName,
    });
  },
};

export default amplitude;