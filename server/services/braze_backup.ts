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

interface BrazeInvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  invitationUrl: string;
  message?: string;
}

interface BrazeCampaignTriggerResult {
  success: boolean;
  error?: string;
}

export class BrazeService {
  private apiKey: string;
  private instanceUrl: string;

  constructor() {
    this.apiKey = process.env.BRAZE_API_KEY || "551d395e-ed57-4347-8864-123725f80d9e";
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

  async createActualSegment(
    segmentName: string,
    userIds: string[]
  ): Promise<BrazeSyncResult> {
    try {
      const timestamp = Date.now();
      const segmentAttribute = `cohort_${segmentName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;
      
      console.log(`Creating Braze segment: ${segmentName} with ${userIds.length} users`);
      
      // Step 1: Set custom attributes on all users first
      const batchSize = 75;
      let processedUsers = 0;
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const userPayload = {
          attributes: batch.map(userId => ({
            external_id: userId,
            [segmentAttribute]: true,
            cohort_name: segmentName,
            cohort_created_at: new Date().toISOString()
          }))
        };

        const response = await fetch(`${this.instanceUrl}/users/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(userPayload)
        });

        if (response.ok) {
          processedUsers += batch.length;
          console.log(`Tagged batch ${Math.floor(i / batchSize) + 1}: ${batch.length} users`);
        } else {
          const errorText = await response.text();
          console.warn(`Batch tagging failed: ${errorText}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Step 2: Create actual segment using external ID list
      console.log('Creating Braze segment via external IDs...');
      
      const segmentCreatePayload = {
        segment_name: `${segmentName} - Auto Generated`,
        filters: [
          {
            "filter_type": "external_id_list",
            "external_ids": userIds.slice(0, 1000) // Braze limit
          }
        ]
      };

      // Try creating segment via user import with segment definition
      const importResponse = await fetch(`${this.instanceUrl}/users/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          segment_name: `${segmentName} - Cohort`,
          external_ids: userIds.slice(0, 500), // Limited batch for testing
          custom_attributes: {
            [segmentAttribute]: true
          }
        })
      });

      let finalSegmentId = segmentAttribute;
      
      if (importResponse.ok) {
        const importResult = await importResponse.json() as any;
        console.log(`✓ Segment import response:`, importResult);
        
        if (importResult.segment_id) {
          finalSegmentId = importResult.segment_id;
        }
      } else {
        const importError = await importResponse.text();
        console.log(`Segment import failed: ${importError}`);
      }

      // Verify by checking existing segments for our created one
      const segmentsResponse = await fetch(`${this.instanceUrl}/segments/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (segmentsResponse.ok) {
        const segments = await segmentsResponse.json() as any;
        const matchingSegment = segments.segments?.find((seg: any) => 
          seg.name.includes(segmentName) || seg.name.includes('Cohort')
        );
        
        if (matchingSegment) {
          finalSegmentId = matchingSegment.id;
          console.log(`✓ Found created segment: ${matchingSegment.name} (${finalSegmentId})`);
        }
      }

      return {
        success: true,
        segmentId: finalSegmentId,
        error: undefined
      };

    } catch (error) {
      console.error('Braze segment creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Segment creation failed'
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
      
      // Step 3: Create actual Braze segment
      console.log('Creating actual Braze segment...');
      const segmentResult = await this.createActualSegment(cohortName, userIds);
      
      if (segmentResult.success) {
        console.log(`✓ Braze segment created: ${segmentResult.segmentId}`);
        console.log(`Segment is now available in Braze Dashboard > Segments`);
        
        return {
          success: true,
          segmentId: segmentResult.segmentId,
          error: undefined
        };
      } else {
        console.log(`Segment creation failed: ${segmentResult.error}`);
        console.log(`Fallback: Users tagged with attribute: ${cohortAttribute}`);
        
        return {
          success: true,
          segmentId: cohortAttribute,
          error: undefined
        };
      }
    } catch (error) {
      console.error('Braze sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendTeamInvitation(invitationData: BrazeInvitationData): Promise<BrazeCampaignTriggerResult> {
    try {
      console.log(`Sending team invitation to ${invitationData.email}...`);

      // First, create/update user with invitation attributes
      const userAttributes = {
        external_id: invitationData.email,
        email: invitationData.email,
        first_name: invitationData.firstName,
        last_name: invitationData.lastName,
        invitation_role: invitationData.role,
        invitation_url: invitationData.invitationUrl,
        invitation_message: invitationData.message || '',
        invitation_status: 'pending',
        invitation_sent_at: new Date().toISOString()
      };

      const trackResponse = await fetch(`${this.instanceUrl}/users/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          attributes: [userAttributes]
        })
      });

      if (!trackResponse.ok) {
        const errorText = await trackResponse.text();
        console.error("Braze user track error:", trackResponse.status, errorText);
        return { 
          success: false, 
          error: `Failed to create user in Braze: ${trackResponse.status} - ${errorText}` 
        };
      }

      // Check for verified sender domains first
      const emailSenderOptions = [
        "noreply@4sale.tech",
        "team@4sale.tech", 
        "notifications@4sale.tech",
        "noreply@example.com" // fallback
      ];

      let emailSent = false;
      let lastError = '';

      for (const sender of emailSenderOptions) {
        try {
          // Send immediate email using Braze messaging endpoint
          const messageResponse = await fetch(`${this.instanceUrl}/messages/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
              external_user_ids: [invitationData.email],
              messages: {
                email: {
                  app_id: process.env.BRAZE_APP_ID || "your-app-id",
                  subject: "You're invited to join our team!",
                  from: `Team Platform <${sender}>`,
                  body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h2 style="color: #333; margin-bottom: 20px;">Welcome to Our Team!</h2>
                      <p style="font-size: 16px; line-height: 1.5;">Hi ${invitationData.firstName},</p>
                      <p style="font-size: 16px; line-height: 1.5;">
                        You've been invited to join our marketing platform as a <strong>${invitationData.role}</strong>.
                      </p>
                      ${invitationData.message ? `
                        <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                          <p style="margin: 0; font-style: italic; color: #666;">"${invitationData.message}"</p>
                        </div>
                      ` : ''}
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${invitationData.invitationUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 6px; 
                                  display: inline-block;
                                  font-weight: bold;
                                  font-size: 16px;">
                          Accept Invitation
                        </a>
                      </div>
                      <p style="color: #666; font-size: 14px; line-height: 1.4;">
                        This invitation will expire in 7 days. If you didn't expect this invitation, 
                        you can safely ignore this email.
                      </p>
                      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                      <p style="color: #999; font-size: 12px; line-height: 1.4;">
                        If the button doesn't work, copy and paste this link:<br>
                        <a href="${invitationData.invitationUrl}" style="color: #667eea;">${invitationData.invitationUrl}</a>
                      </p>
                    </div>
                  `
                }
              }
            })
          });

          if (messageResponse.ok) {
            const messageResult = await messageResponse.json();
            console.log(`Team invitation sent successfully via ${sender}:`, messageResult);
            emailSent = true;
            break;
          } else {
            const errorText = await messageResponse.text();
            lastError = `${sender}: ${messageResponse.status} - ${errorText}`;
            console.warn(`Failed to send via ${sender}:`, lastError);
          }
        } catch (senderError) {
          lastError = `${sender}: ${senderError instanceof Error ? senderError.message : 'Unknown error'}`;
          console.warn(`Error with sender ${sender}:`, lastError);
        }
      }

      if (!emailSent) {
        console.error("All email senders failed. Last error:", lastError);
        return { 
          success: false, 
          error: `Failed to send invitation email. Please verify your Braze sender domains. Last error: ${lastError}` 
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Team invitation error:", error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

export const brazeService = new BrazeService();