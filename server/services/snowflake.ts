import snowflake from 'snowflake-sdk';

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
  private connection: any = null;

  constructor(config: SnowflakeConfig) {
    this.config = config;
  }

  private async connect(): Promise<any> {
    if (this.connection) {
      return this.connection;
    }

    return new Promise((resolve, reject) => {
      this.connection = snowflake.createConnection({
        account: this.config.account,
        username: this.config.username,
        password: this.config.password,
        warehouse: this.config.warehouse,
        database: this.config.database,
        schema: this.config.schema
      });

      this.connection.connect((err: any, conn: any) => {
        if (err) {
          console.error('Snowflake connection failed:', err);
          reject(err);
        } else {
          console.log('Snowflake connection successful');
          resolve(conn);
        }
      });
    });
  }

  async executeQuery(query: string): Promise<QueryResult> {
    try {
      const conn = await this.connect();

      return new Promise((resolve) => {
        conn.execute({
          sqlText: query,
          complete: (err: any, stmt: any, rows: any) => {
            if (err) {
              console.error('Snowflake query error:', err);
              
              // Handle network policy errors
              if (err.message && (err.message.includes('Network policy') || err.code === '390432')) {
                resolve({
                  columns: [],
                  rows: [],
                  success: false,
                  error: "Snowflake Network Policy Error: IP address needs to be whitelisted in your Snowflake network policy."
                });
                return;
              }
              
              resolve({
                columns: [],
                rows: [],
                success: false,
                error: err.message || "Query execution failed"
              });
              return;
            }

            try {
              // Extract column metadata from statement
              const columns: ColumnMetadata[] = stmt.getColumns().map((col: any) => ({
                name: col.getName(),
                type: col.getType()
              }));

              // Convert rows to proper array format
              const rowData = rows.map((row: any) => {
                return columns.map(col => row[col.name]);
              });

              console.log(`Snowflake query successful: ${rows.length} rows returned`);

              resolve({
                columns,
                rows: rowData,
                success: true
              });
            } catch (processError) {
              console.error('Error processing Snowflake results:', processError);
              resolve({
                columns: [],
                rows: [],
                success: false,
                error: "Error processing query results"
              });
            }
          }
        });
      });

    } catch (error) {
      console.error('Snowflake connection error:', error);
      return {
        columns: [],
        rows: [],
        success: false,
        error: error instanceof Error ? error.message : "Connection error"
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      return new Promise((resolve) => {
        this.connection.destroy((err: any) => {
          if (err) {
            console.error('Error disconnecting from Snowflake:', err);
          }
          this.connection = null;
          resolve();
        });
      });
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