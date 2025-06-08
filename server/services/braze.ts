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
    this.apiKey = "3cb9fbad-67d8-4ee8-ad9d-ba59660f35b2";
    this.instanceUrl = "https://rest.fra-02.braze.eu";
  }

  async syncCohort(
    cohortName: string,
    userIds: string[]
  ): Promise<BrazeSyncResult> {
    try {
      const url = `${this.instanceUrl}/users/track`;
      
      // Create attribute objects for each user
      const attributeObjects: BrazeUserAttributeRequest[] = userIds.map(userId => ({
        external_id: userId,
        [`cohort_${cohortName.toLowerCase().replace(/\s+/g, '_')}`]: true
      }));

      const payload: BrazeSyncPayload = {
        attributes: attributeObjects
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Braze API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as any;
      
      return {
        success: true,
        segmentId: `cohort_${cohortName.toLowerCase().replace(/\s+/g, '_')}`,
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