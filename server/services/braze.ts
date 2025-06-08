import fetch from 'node-fetch';

interface BrazeUserAttributeRequest {
  external_id: string;
  [key: string]: any;
}

interface BrazeSyncPayload {
  attributes: BrazeUserAttributeRequest[];
}

interface BrazeSyncResult {
  success: boolean;
  segmentId?: string;
  error?: string;
}

export class BrazeService {
  private apiKey: string;
  private instanceUrl: string;

  constructor() {
    this.apiKey = process.env.BRAZE_API_KEY || "3cb9fbad-67d8-4ee8-ad9d-ba59660f35b2";
    this.instanceUrl = process.env.BRAZE_INSTANCE_URL || "https://rest.fra-02.braze.eu";
    
    if (!this.apiKey || !this.instanceUrl) {
      console.warn("Braze API credentials not properly configured");
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test with a minimal request to validate credentials
      const response = await fetch(`${this.instanceUrl}/users/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          attributes: []
        })
      });

      if (response.status === 401) {
        return { success: false, error: "Invalid API key" };
      }
      
      if (response.status === 400) {
        const result = await response.text();
        // Empty attributes array should return a validation error, which means connection works
        if (result.includes("attributes") || result.includes("empty")) {
          return { success: true };
        }
      }

      return { success: response.ok };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Connection failed" 
      };
    }
  }

  async syncCohort(
    cohortName: string,
    userIds: string[]
  ): Promise<BrazeSyncResult> {
    try {
      const cohortAttribute = `cohort_${cohortName.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Step 1: Create/update user attributes in batches
      const batchSize = 75;
      let totalProcessed = 0;
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const attributeObjects: BrazeUserAttributeRequest[] = batch.map(userId => ({
          external_id: userId,
          [cohortAttribute]: true
        }));

        const payload: BrazeSyncPayload = {
          attributes: attributeObjects
        };

        const response = await fetch(`${this.instanceUrl}/users/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Braze users/track API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json() as any;
        
        if (result.errors && result.errors.length > 0) {
          console.warn(`Braze batch ${i / batchSize + 1} had errors:`, result.errors);
        }
        
        totalProcessed += batch.length;
        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: ${batch.length} users (${totalProcessed}/${userIds.length} total)`);
        
        if (i + batchSize < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Step 2: Log completion and provide instructions for segment creation
      console.log(`Successfully synced ${totalProcessed} users to Braze with attribute: ${cohortAttribute}`);
      console.log(`To create a segment in Braze:`);
      console.log(`1. Go to Braze Dashboard > Segments`);
      console.log(`2. Create New Segment`);
      console.log(`3. Add filter: Custom Attribute > ${cohortAttribute} > equals > true`);
      console.log(`4. Name the segment: "${cohortName} - Auto Cohort"`);
      
      return {
        success: true,
        segmentId: cohortAttribute,
        error: undefined
      };
    } catch (error) {
      console.error('Braze sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const brazeService = new BrazeService();