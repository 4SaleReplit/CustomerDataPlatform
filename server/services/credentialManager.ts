import { storage } from '../storage';
import * as crypto from 'crypto';

export interface DecryptedCredentials {
  [key: string]: string;
}

export class CredentialManager {
  private static instance: CredentialManager;
  private encryptionKey: string;

  constructor() {
    // Use a consistent key for encryption (in production, this should be from secure env)
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-development-key-32-chars';
    
    // Ensure key is 32 characters for AES-256
    if (this.encryptionKey.length < 32) {
      this.encryptionKey = this.encryptionKey.padEnd(32, '0');
    } else if (this.encryptionKey.length > 32) {
      this.encryptionKey = this.encryptionKey.substring(0, 32);
    }
  }

  static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  /**
   * Encrypt credentials for storage
   */
  encryptCredentials(credentials: Record<string, any>): string {
    try {
      const text = JSON.stringify(credentials);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      // Fallback to plain JSON for development
      return JSON.stringify(credentials);
    }
  }

  /**
   * Decrypt credentials from storage
   */
  decryptCredentials(encryptedData: string): DecryptedCredentials {
    try {
      // Check if data is already in plain JSON format
      if (encryptedData.startsWith('{')) {
        return JSON.parse(encryptedData);
      }

      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        // Fallback to plain JSON
        return JSON.parse(encryptedData);
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      // Fallback to parsing as plain JSON
      try {
        return JSON.parse(encryptedData);
      } catch {
        return {};
      }
    }
  }

  /**
   * Get credentials for a specific integration type
   */
  async getIntegrationCredentials(integrationType: string): Promise<DecryptedCredentials | null> {
    try {
      const integration = await storage.getIntegrationByType(integrationType);
      
      if (!integration || integration.status !== 'connected') {
        return null;
      }

      const credentials = integration.credentials as Record<string, any>;
      return this.decryptCredentials(JSON.stringify(credentials));
    } catch (error) {
      console.error(`Error getting ${integrationType} credentials:`, error);
      return null;
    }
  }

  /**
   * Get Snowflake credentials from database integration
   */
  async getSnowflakeCredentials(): Promise<{
    account: string;
    username: string;
    password: string;
    warehouse: string;
    database: string;
    schema: string;
  } | null> {
    const credentials = await this.getIntegrationCredentials('snowflake');
    
    if (!credentials) {
      console.warn('No Snowflake integration found or not connected');
      return null;
    }

    return {
      account: credentials.account || '',
      username: credentials.username || '',
      password: credentials.password || '',
      warehouse: credentials.warehouse || 'COMPUTE_WH',
      database: credentials.database || 'SNOWFLAKE',
      schema: credentials.schema || 'PUBLIC'
    };
  }

  /**
   * Get PostgreSQL credentials from database integration
   */
  async getPostgreSQLCredentials(): Promise<{
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    connectionString?: string;
  } | null> {
    const credentials = await this.getIntegrationCredentials('postgresql');
    
    if (!credentials) {
      return null;
    }

    // If connection string is provided, parse it
    if (credentials.connectionString && !credentials.useIndividualFields) {
      try {
        const url = new URL(credentials.connectionString);
        return {
          host: url.hostname || 'localhost',
          port: parseInt(url.port) || 5432,
          database: url.pathname.slice(1) || '',
          username: url.username || '',
          password: url.password || '',
          ssl: url.searchParams.get('sslmode') !== 'disable',
          connectionString: credentials.connectionString
        };
      } catch (error) {
        console.error('Error parsing PostgreSQL connection string:', error);
        // Fall back to individual fields if parsing fails
      }
    }

    // Use individual fields
    return {
      host: credentials.host || 'localhost',
      port: parseInt(credentials.port) || 5432,
      database: credentials.database || '',
      username: credentials.username || '',
      password: credentials.password || '',
      ssl: credentials.ssl !== 'disable'
    };
  }

  /**
   * Store encrypted credentials for an integration
   */
  async storeIntegrationCredentials(integrationId: string, credentials: Record<string, any>): Promise<void> {
    try {
      const encryptedCredentials = this.encryptCredentials(credentials);
      await storage.updateIntegration(integrationId, {
        credentials: JSON.parse(encryptedCredentials)
      });
    } catch (error) {
      console.error('Error storing credentials:', error);
      throw error;
    }
  }

  /**
   * Validate credentials by testing connection
   */
  async validateCredentials(integrationType: string, credentials: Record<string, any>): Promise<boolean> {
    switch (integrationType) {
      case 'snowflake':
        return this.validateSnowflakeCredentials(credentials);
      case 'postgresql':
        return this.validatePostgreSQLCredentials(credentials);
      default:
        return false;
    }
  }

  private async validateSnowflakeCredentials(credentials: Record<string, any>): Promise<boolean> {
    try {
      const { SnowflakeService } = await import('./snowflake');
      const testService = new SnowflakeService({
        account: credentials.account,
        username: credentials.username,
        password: credentials.password,
        warehouse: credentials.warehouse || 'COMPUTE_WH',
        database: credentials.database || 'SNOWFLAKE',
        schema: credentials.schema || 'PUBLIC'
      });
      
      const result = await testService.executeQuery('SELECT 1 as test');
      return result.success;
    } catch (error) {
      console.error('Snowflake credential validation error:', error);
      return false;
    }
  }

  private async validatePostgreSQLCredentials(credentials: Record<string, any>): Promise<boolean> {
    try {
      const { Pool } = await import('pg');
      const testPool = new Pool({
        host: credentials.host,
        port: parseInt(credentials.port) || 5432,
        database: credentials.database,
        user: credentials.username,
        password: credentials.password,
        ssl: credentials.ssl !== 'disable'
      });

      const client = await testPool.connect();
      await client.query('SELECT 1');
      client.release();
      await testPool.end();
      
      return true;
    } catch (error) {
      console.error('PostgreSQL credential validation error:', error);
      return false;
    }
  }
}

export const credentialManager = CredentialManager.getInstance();