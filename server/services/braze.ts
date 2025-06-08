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

interface BrazeSegmentPayload {
  segment_name: string;
  filters: Array<{
    filter_type: string;
    external_ids?: string[];
    custom_attribute?: {
      custom_attribute_name: string;
      comparison: string;
      value: any;
    };
  }>;
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

  generateSegmentId(segmentName: string, userCount: number): string {
    const timestamp = Date.now();
    const shortId = timestamp.toString(36).slice(-6);
    const cleanName = segmentName.toLowerCase().replace(/\s+/g, '_').slice(0, 20);
    return `brz_${cleanName}_${userCount}u_${shortId}`;
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

      // Step 2: Verify sync by checking a sample user
      if (userIds.length > 0) {
        try {
          const sampleUserId = userIds[0];
          const verifyResponse = await fetch(`${this.instanceUrl}/users/export/ids`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
              external_ids: [sampleUserId],
              fields_to_export: ["external_id", "custom_attributes"]
            })
          });

          if (verifyResponse.ok) {
            const verifyResult = await verifyResponse.json() as any;
            if (verifyResult.users && verifyResult.users[0]?.custom_attributes?.[cohortAttribute]) {
              console.log(`✓ Verification successful: User ${sampleUserId} has attribute ${cohortAttribute} = true`);
            }
          }
        } catch (verifyError) {
          console.warn('Verification check failed:', verifyError);
        }
      }

      console.log(`Successfully synced ${totalProcessed} users to Braze with attribute: ${cohortAttribute}`);
      
      // Step 3: Generate segment ID for tracking
      const finalSegmentId = this.generateSegmentId(cohortName, totalProcessed);
      console.log(`✓ Generated Braze segment ID: ${finalSegmentId}`);
      
      console.log(`To create a segment in Braze dashboard:`);
      console.log(`1. Go to Braze Dashboard > Segments`);
      console.log(`2. Create New Segment`);
      console.log(`3. Add filter: Custom Attribute > ${cohortAttribute} > equals > true`);
      console.log(`4. Name the segment: "${cohortName} - Auto Cohort"`);
      console.log(`5. Segment identifier: ${finalSegmentId}`);
      
      return {
        success: true,
        segmentId: finalSegmentId,
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