import fetch, { Response } from 'node-fetch';

interface SnowflakeConfig {
  account: string;
  username: string;
  password: string;
  warehouse: string;
  database: string;
  schema: string;
}

interface ColumnMetadata {
  name: string;
  type: string;
}

interface QueryResult {
  columns: ColumnMetadata[];
  rows: any[][];
  success: boolean;
  error?: string;
}

export class SnowflakeService {
  private config: SnowflakeConfig;
  private sessionToken: string | null = null;
  private sessionExpiry: number = 0;

  constructor(config: SnowflakeConfig) {
    this.config = config;
  }

  private async authenticate(): Promise<string> {
    // Check if we have a valid session token
    if (this.sessionToken && Date.now() < this.sessionExpiry) {
      return this.sessionToken;
    }

    // Use Snowflake's SQL API authentication endpoint
    const authUrl = `https://${this.config.account}.snowflakecomputing.com/api/v2/oauth/token`;
    
    const authPayload = {
      grant_type: 'password',
      username: this.config.username,
      password: this.config.password,
      scope: 'session:role-any'
    };

    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(authPayload).toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Snowflake OAuth failed: ${response.status} - ${errorText}`);
        
        // If OAuth fails, try the legacy approach with direct token generation
        return await this.generateJWTToken();
      }

      const result = await response.json() as any;
      
      if (!result.access_token) {
        throw new Error(`OAuth failed: No access token received`);
      }

      this.sessionToken = result.access_token;
      // Set expiry based on token expiry or default to 1 hour
      this.sessionExpiry = Date.now() + ((result.expires_in || 3600) * 1000);
      
      return this.sessionToken;
    } catch (error) {
      console.error('Snowflake OAuth error:', error);
      // Fallback to JWT generation
      return await this.generateJWTToken();
    }
  }

  private async generateJWTToken(): Promise<string> {
    // For now, let's try using the provided credentials directly with basic auth to SQL API
    // This is a simplified approach that may work with some Snowflake configurations
    const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    
    // Try to get session token from login endpoint
    const loginUrl = `https://${this.config.account}.snowflakecomputing.com/session/v1/login-request`;
    
    const loginPayload = {
      data: {
        ACCOUNT_NAME: this.config.account,
        LOGIN_NAME: this.config.username,
        PASSWORD: this.config.password,
        CLIENT_APP_ID: "RestAPI",
        CLIENT_APP_VERSION: "1.0.0"
      }
    };

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as any;
    
    if (result.success && result.data && result.data.token) {
      this.sessionToken = result.data.token;
      this.sessionExpiry = Date.now() + (4 * 60 * 60 * 1000);
      return this.sessionToken;
    } else {
      throw new Error(`Login failed: ${result.message || 'No token received'}`);
    }
  }

  async executeQuery(query: string): Promise<QueryResult> {
    const statementsUrl = `https://${this.config.account}.snowflakecomputing.com/api/v2/statements`;
    
    try {
      // Get authentication token
      const token = await this.authenticate();
      
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      };

      const payload = {
        statement: query,
        warehouse: this.config.warehouse,
        database: this.config.database,
        schema: this.config.schema,
        timeout: 60
      };

      // Submit the query
      const response = await fetch(statementsUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Snowflake query error: ${response.status} - ${errorText}`);
        
        // Handle network policy errors specifically
        if (errorText.includes("Network policy is required") || errorText.includes("390432")) {
          return {
            columns: [],
            rows: [],
            success: false,
            error: "Snowflake Network Policy Error: IP address needs to be whitelisted in your Snowflake network policy."
          };
        }
        
        return {
          columns: [],
          rows: [],
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        };
      }

      const result = await response.json() as any;
      const statementStatusUrl = result.statementStatusUrl;

      // Poll for query completion
      let queryComplete = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!queryComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await fetch(statementStatusUrl, {
          method: 'GET',
          headers
        });

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          return {
            columns: [],
            rows: [],
            success: false,
            error: `Status check failed: HTTP ${statusResponse.status}: ${statusResponse.statusText} - ${errorText}`
          };
        }

        const statusResult = await statusResponse.json() as any;
        
        if (statusResult.statementStatusUrl) {
          attempts++;
          continue;
        } else {
          queryComplete = true;
          
          if (statusResult.resultSet) {
            return {
              columns: statusResult.resultSet.resultSetMetaData.rowType.map((col: any) => ({
                name: col.name,
                type: col.type
              })),
              rows: statusResult.resultSet.data || [],
              success: true
            };
          } else {
            return {
              columns: [],
              rows: [],
              success: false,
              error: statusResult.message || "Query completed but no results returned"
            };
          }
        }
      }

      return {
        columns: [],
        rows: [],
        success: false,
        error: "Query timeout: The query took too long to complete"
      };

    } catch (error) {
      return {
        columns: [],
        rows: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}

// Load environment variables
import { config } from "dotenv";
config();

export const snowflakeService = new SnowflakeService({
  account: process.env.SNOWFLAKE_ACCOUNT || "q84sale",
  username: "CDP_USER",
  password: "P0PmCtwMKOIFi6F",
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH", 
  database: process.env.SNOWFLAKE_DATABASE || "DBT_CORE_PROD_DATABASE",
  schema: process.env.SNOWFLAKE_SCHEMA || "OPERATIONS"
});