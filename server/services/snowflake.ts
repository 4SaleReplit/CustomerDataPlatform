import fetch, { Response } from 'node-fetch';

interface SnowflakeConfig {
  account: string;
  accessToken: string;
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

  constructor(config: SnowflakeConfig) {
    this.config = config;
  }

  async executeQuery(query: string): Promise<QueryResult> {
    const statementsUrl = `https://${this.config.account}.snowflakecomputing.com/api/v2/statements`;
    
    const headers = {
      "Authorization": `Bearer ${this.config.accessToken}`,
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

    try {
      // 1. Submit the asynchronous query
      const response = await fetch(statementsUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Snowflake query error: ${response.status} - ${errorText}`);
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
  accessToken: process.env.SNOWFLAKE_ACCESS_TOKEN || "eyJraWQiOiIzNjUyNTkwNTY5ODU1MzkwIiwiYWxnIjoiRVMyNTYifQ.eyJwIjoiNTU3MzQxMDk1MDk6NTU3MzQxMDg0MjEiLCJpc3MiOiJTRjoxMDA5IiwiZXhwIjoxNzUwMDA2NTcwfQ.VZrZLmq1WZLjV11Wj_Pd6OqPxHDyG_apRkwhrhGSKyh-EEMTRLliCx8qrn5zzbSftwkrpzoSoMsHVLF_IJFCbg",
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || "LOOKER",
  database: process.env.SNOWFLAKE_DATABASE || "DBT_CORE_PROD_DATABASE",
  schema: process.env.SNOWFLAKE_SCHEMA || "USER_SEGMENTATION_PROJECT_V4"
});