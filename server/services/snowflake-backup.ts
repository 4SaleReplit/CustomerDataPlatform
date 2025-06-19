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

  constructor(config: SnowflakeConfig) {
    this.config = config;
  }

  async executeQuery(query: string): Promise<QueryResult> {
    try {
      // Dynamic import with proper CommonJS handling
      const snowflakeModule = await eval('import("snowflake-sdk")');
      const snowflake = snowflakeModule.default || snowflakeModule;

      return new Promise((resolve) => {
        const connection = snowflake.createConnection({
          account: this.config.account,
          username: this.config.username,
          password: this.config.password,
          warehouse: this.config.warehouse,
          database: this.config.database,
          schema: this.config.schema,
          application: 'NodeJS_CDP_Platform'
        });

        connection.connect((err: any) => {
          if (err) {
            console.error('Snowflake connection failed:', err);
            
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
              error: err.message || "Connection failed"
            });
            return;
          }

          console.log('Snowflake connection successful');

          // First, explicitly set the warehouse if not already active
          const useWarehouseQuery = `USE WAREHOUSE ${this.config.warehouse}`;
          
          connection.execute({
            sqlText: useWarehouseQuery,
            complete: (warehouseErr: any) => {
              if (warehouseErr) {
                console.warn('Warning setting warehouse:', warehouseErr.message);
                // Continue anyway as warehouse might already be set
              }
              
              // Now execute the actual query
              connection.execute({
                sqlText: query,
                fetchAsString: ['Number', 'Date'],
                streamResult: false,
                complete: (queryErr: any, stmt: any, rows: any) => {
                  // Clean up connection
                  connection.destroy((destroyErr: any) => {
                    if (destroyErr) {
                      console.error('Error closing Snowflake connection:', destroyErr);
                    }
                  });

                  if (queryErr) {
                    console.error('Snowflake query error:', queryErr);
                    
                    if (queryErr.message && (queryErr.message.includes('Network policy') || queryErr.code === '390432')) {
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
                      error: queryErr.message || "Query execution failed"
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
                      return columns.map((col: any) => row[col.name]);
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
            }
          });
        });
      });

    } catch (error) {
      console.error('Snowflake service error:', error);
      return {
        columns: [],
        rows: [],
        success: false,
        error: error instanceof Error ? error.message : "Service error"
      };
    }
  }
}

// Load environment variables
import { config } from "dotenv";
import { credentialManager } from './credentialManager';
config();

/**
 * Get dynamic Snowflake service instance using integration credentials
 */
export async function getDynamicSnowflakeService(): Promise<SnowflakeService | null> {
  const credentials = await credentialManager.getSnowflakeCredentials();
  
  if (!credentials) {
    console.warn('No Snowflake integration credentials found. Please configure Snowflake integration.');
    return null;
  }

  return new SnowflakeService(credentials);
}

// All Snowflake operations now use getDynamicSnowflakeService() 
// which loads credentials from database integration