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
  private masterToken: string | null = null;
  private sessionToken: string | null = null;
  private sessionExpiry: number = 0;

  constructor(config: SnowflakeConfig) {
    this.config = config;
  }

  private async authenticate(): Promise<{ sessionToken: string; masterToken: string }> {
    // Check if we have valid tokens
    if (this.sessionToken && this.masterToken && Date.now() < this.sessionExpiry) {
      return { sessionToken: this.sessionToken, masterToken: this.masterToken };
    }

    const loginUrl = `https://${this.config.account}.snowflakecomputing.com/session/v1/login-request`;
    
    const loginPayload = {
      data: {
        ACCOUNT_NAME: this.config.account,
        LOGIN_NAME: this.config.username,
        PASSWORD: this.config.password,
        CLIENT_APP_ID: "JavaScript",
        CLIENT_APP_VERSION: "1.0.0"
      }
    };

    try {
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
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as any;
      
      if (!result.success || !result.data) {
        throw new Error(`Authentication failed: ${result.message || 'No data received'}`);
      }

      this.sessionToken = result.data.token;
      this.masterToken = result.data.masterToken;
      
      const validitySeconds = result.data.validityInSeconds || 3600;
      this.sessionExpiry = Date.now() + (validitySeconds * 1000);
      
      console.log(`Snowflake authentication successful, token expires in ${validitySeconds} seconds`);
      return { sessionToken: this.sessionToken, masterToken: this.masterToken };
    } catch (error) {
      console.error('Snowflake authentication error:', error);
      throw error;
    }
  }

  async executeQuery(query: string): Promise<QueryResult> {
    try {
      // Get authentication tokens
      const { sessionToken, masterToken } = await this.authenticate();
      
      // Use the correct Snowflake SQL API v2 endpoint
      const sqlUrl = `https://${this.config.account}.snowflakecomputing.com/api/v2/statements`;
      
      const headers = {
        "Authorization": `Snowflake Token="${sessionToken}"`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Snowflake-Authorization-Token-Type": "KEYPAIR_JWT"
      };

      const payload = {
        statement: query,
        warehouse: this.config.warehouse,
        database: this.config.database,
        schema: this.config.schema,
        timeout: 60,
        role: "PUBLIC"
      };

      const response = await fetch(sqlUrl, {
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
      
      // Handle asynchronous query response
      if (result.statementHandle || result.statementStatusUrl) {
        // Poll for results
        const statusUrl = result.statementStatusUrl || `${sqlUrl}/${result.statementHandle}`;
        
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(statusUrl, {
            method: 'GET',
            headers: {
              "Authorization": `Snowflake Token="${sessionToken}"`,
              "Accept": "application/json"
            }
          });
          
          if (!statusResponse.ok) {
            break;
          }
          
          const statusResult = await statusResponse.json() as any;
          
          if (statusResult.resultSet) {
            const metaData = statusResult.resultSet.resultSetMetaData?.rowType || [];
            return {
              columns: metaData.map((col: any) => ({
                name: col.name,
                type: col.type
              })),
              rows: statusResult.resultSet.data || [],
              success: true
            };
          }
          
          if (!statusResult.statementStatusUrl) {
            break;
          }
          
          attempts++;
        }
      }
      
      // Handle synchronous response
      if (result.resultSet) {
        const metaData = result.resultSet.resultSetMetaData?.rowType || [];
        return {
          columns: metaData.map((col: any) => ({
            name: col.name,
            type: col.type
          })),
          rows: result.resultSet.data || [],
          success: true
        };
      }

      return {
        columns: [],
        rows: [],
        success: false,
        error: "Query executed but no results returned"
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
  account: "q84sale",
  username: "CDP_USER",
  password: "P0PmCtwMKOIFi6F",
  warehouse: "LOOKER",
  database: "DBT_CORE_PROD_DATABASE",
  schema: "USER_SEGMENTATION_PROJECT_V4"
});