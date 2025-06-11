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

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `Connection failed: ${response.status} - ${errorText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown connection error" 
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

      // Try multiple verified sender domains
      const emailSenderOptions = [
        "noreply@4sale.tech",
        "team@4sale.tech", 
        "notifications@4sale.tech"
      ];

      let emailSent = false;
      let lastError = '';

      for (const sender of emailSenderOptions) {
        try {
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

  async syncCohort(cohortName: string, userIds: string[]): Promise<BrazeSyncResult> {
    try {
      console.log(`Syncing cohort "${cohortName}" with ${userIds.length} users to Braze...`);
      
      if (userIds.length === 0) {
        return { success: false, error: "No user IDs provided" };
      }

      const attributes = userIds.map(userId => ({
        external_id: userId,
        cohort_membership: cohortName,
        last_sync_date: new Date().toISOString()
      }));

      const payload: BrazeSyncPayload = {
        attributes
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
        console.error("Braze sync error:", response.status, errorText);
        return { 
          success: false, 
          error: `Braze API error: ${response.status} - ${errorText}` 
        };
      }

      const result = await response.json();
      console.log("Braze sync successful:", result);

      return { 
        success: true, 
        segmentId: cohortName 
      };
    } catch (error) {
      console.error("Braze sync error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      };
    }
  }
}

export const brazeService = new BrazeService();