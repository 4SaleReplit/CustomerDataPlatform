import fetch from 'node-fetch';

interface AmplitudeCohortRequest {
  name: string;
  app_id: number;
  id_type: string;
  ids: string[];
  owner: string;
  published: boolean;
}

interface AmplitudeSyncResult {
  success: boolean;
  cohortId?: string;
  error?: string;
}

export class AmplitudeService {
  private apiKey: string;
  private secretKey: string;
  private appId: number;

  constructor() {
    this.apiKey = "ea353a2eec64ceddbb5cde4f6d9ee886";
    this.secretKey = "d23365841beb31d9f805bea5a8f98975";
    this.appId = 123456;
  }

  async syncCohort(
    cohortName: string,
    userIds: string[],
    ownerEmail: string = "data-team@yourcompany.com"
  ): Promise<AmplitudeSyncResult> {
    const url = "https://amplitude.com/api/3/cohorts/upload";
    
    const payload: AmplitudeCohortRequest = {
      name: cohortName,
      app_id: this.appId,
      id_type: "BY_USER_ID",
      ids: userIds,
      owner: ownerEmail,
      published: true
    };

    // Create Basic Auth header
    const authString = `${this.apiKey}:${this.secretKey}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Basic ${base64Auth}`
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        cohortId: result.cohort_id || result.id,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

export const amplitudeService = new AmplitudeService();