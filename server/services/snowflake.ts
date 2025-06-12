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
      
      // Use Snowflake's query execution endpoint
      const queryUrl = `https://${this.config.account}.snowflakecomputing.com/queries/v1/query-request`;
      
      const headers = {
        "Authorization": `Snowflake Token="${sessionToken}"`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Snowflake-Authorization-Token-Type": "KEYPAIR_JWT"
      };

      const payload = {
        sqlText: query,
        warehouse: this.config.warehouse,
        database: this.config.database,
        schema: this.config.schema,
        sequenceId: Date.now(),
        querySubmissionTime: Date.now()
      };

      const response = await fetch(queryUrl, {
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
      
      // Check if query was successful
      if (!result.success) {
        return {
          columns: [],
          rows: [],
          success: false,
          error: result.message || "Query execution failed"
        };
      }

      // Extract results from the response
      if (result.data && result.data.resultSet) {
        const resultSet = result.data.resultSet;
        const metaData = resultSet.metaData || [];
        
        return {
          columns: metaData.map((col: any) => ({
            name: col.name,
            type: col.typeName || col.type
          })),
          rows: resultSet.data || [],
          success: true
        };
      } else if (result.data && result.data.rowset) {
        // Handle different response format
        const rowset = result.data.rowset;
        return {
          columns: rowset[0] ? Object.keys(rowset[0]).map(key => ({ name: key, type: 'VARCHAR' })) : [],
          rows: rowset.map((row: any) => Object.values(row)),
          success: true
        };
      } else {
        return {
          columns: [],
          rows: [],
          success: true,
          error: "Query executed successfully but no result set returned"
        };
      }

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