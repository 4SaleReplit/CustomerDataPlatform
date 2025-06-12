import fetch, { Response } from 'node-fetch';
import { createHash } from 'crypto';

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
      
      if (!result.success || !result.data || !result.data.token) {
        throw new Error(`Authentication failed: ${result.message || 'No token received'}`);
      }

      this.sessionToken = result.data.token;
      // Set expiry to 4 hours from now (Snowflake sessions typically last 4-12 hours)
      this.sessionExpiry = Date.now() + (4 * 60 * 60 * 1000);
      
      return this.sessionToken;
    } catch (error) {
      console.error('Snowflake authentication error:', error);
      throw error;
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
      // 1. Submit the asynchronous query
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
            error: "Snowflake Network Policy Error: Replit's IP address needs to be whitelisted in your Snowflake network policy. Please contact your Snowflake administrator to add Replit's IP ranges to the allowed network policy."
          };
        }
        
        return {
          columns: [],
          rows: [],
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        };
      }

      const respJson = await response.json() as any;
      const statementHandle = respJson.statementHandle;

      if (!statementHandle) {
        return {
          columns: [],
          rows: [],
          success: false,
          error: "No statement handle returned"
        };
      }

      // 2. Poll for results
      const statusUrl = `${statementsUrl}/${statementHandle}`;
      let attempts = 0;
      const maxAttempts = 30; // 1 minute timeout

      while (attempts < maxAttempts) {
        const statusResponse = await fetch(statusUrl, { headers });
        
        if (!statusResponse.ok) {
          return {
            columns: [],
            rows: [],
            success: false,
            error: `Status check failed: ${statusResponse.status}`
          };
        }

        const statusJson = await statusResponse.json() as any;

        if (statusJson.message === "Statement executed successfully.") {
          // 3. Extract data
          const columns = statusJson.resultSetMetaData?.rowType?.map((col: any) => ({
            name: col.name,
            type: col.type
          })) || [];

          const rows = statusJson.data || [];

          return {
            columns,
            rows,
            success: true
          };
        } else if (statusJson.message && statusJson.message.toUpperCase().includes("FAILED")) {
          return {
            columns: [],
            rows: [],
            success: false,
            error: statusJson.message
          };
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      return {
        columns: [],
        rows: [],
        success: false,
        error: "Query execution timeout"
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

// Load environment variables at module level
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