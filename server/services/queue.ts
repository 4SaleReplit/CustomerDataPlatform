import Bull from 'bull';
import { db } from '../db';
import { campaignJobs, campaigns, cohorts } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { snowflakeService } from './snowflake';

// Initialize Redis queue
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const campaignQueue = new Bull('campaign processing', redisUrl);

interface CampaignJobData {
  campaignId: string;
  cohortId: string;
  upsellItems: any[];
}

interface UpsellRecommendation {
  user_adv_id: number;
  user_id: string;
  upselling_items: Array<{
    item_type: string;
    sold: string | null;
    last_sync: string;
    valid_until: string;
    upselling_msg: {
      message_id: number | string;
      metric_value: string | null;
      metric_indicator: string;
    };
  }>;
}

// Generate random user_adv_id as requested
function generateRandomUserAdvId(): number {
  return Math.floor(Math.random() * 10000000) + 1000000;
}

// Create upselling recommendation in the specified format
function createUpsellRecommendation(userId: string, upsellItems: any[]): UpsellRecommendation {
  const currentDate = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
  
  return {
    user_adv_id: generateRandomUserAdvId(),
    user_id: userId,
    upselling_items: upsellItems.map(item => ({
      item_type: item.item_type || 'refresh',
      sold: null,
      last_sync: currentDate,
      valid_until: item.valid_until || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
      upselling_msg: {
        message_id: item.message || 'Ad is declining in views, push it to top now',
        metric_value: item.metric_value || 'ad views dropped by 15%',
        metric_indicator: item.metric_indicator || 'declining'
      }
    }))
  };
}

// Process campaign job
campaignQueue.process(async (job) => {
  const { campaignId, cohortId, upsellItems } = job.data as CampaignJobData;
  
  try {
    // Get cohort data to access the calculation query
    const cohort = await db.select().from(cohorts).where(eq(cohorts.id, cohortId)).limit(1);
    if (!cohort.length) {
      throw new Error(`Cohort ${cohortId} not found`);
    }
    
    const cohortData = cohort[0];
    const calculationQuery = cohortData.calculationQuery;
    
    if (!calculationQuery) {
      throw new Error(`No calculation query found for cohort ${cohortId}`);
    }
    
    // Execute the cohort query to get user IDs
    const queryResult = await snowflakeService.executeQuery(calculationQuery);
    
    if (!queryResult.success) {
      throw new Error(`Failed to execute cohort query: ${queryResult.error}`);
    }
    
    // Process each user in the cohort
    const userIds = queryResult.rows.map(row => row[0]); // Assuming USER_ID is the first column
    
    for (const userId of userIds) {
      const recommendation = createUpsellRecommendation(userId, upsellItems);
      
      // Store the job in the database
      await db.insert(campaignJobs).values({
        campaignId,
        jobId: job.id.toString(),
        userId: userId,
        userAdvId: recommendation.user_adv_id,
        recommendation,
        status: 'sent'
      });
      
      // Here you would typically send the recommendation to your messaging system
      // For now, we'll just log it
      console.log(`Recommendation sent to user ${userId}:`, JSON.stringify(recommendation, null, 2));
    }
    
    // Update campaign statistics
    await db.update(campaigns)
      .set({ 
        messagesSent: userIds.length,
        startedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId));
    
    return { processed: userIds.length };
    
  } catch (error) {
    console.error('Campaign job failed:', error);
    
    // Update job status to failed
    await db.insert(campaignJobs).values({
      campaignId,
      jobId: job.id.toString(),
      userId: 'unknown',
      userAdvId: 0,
      recommendation: {},
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
});

// Queue a campaign for processing
export async function queueCampaign(campaignId: string, cohortId: string, upsellItems: any[]) {
  const job = await campaignQueue.add('process-campaign', {
    campaignId,
    cohortId,
    upsellItems
  });
  
  return job.id;
}

// Get queue statistics
export async function getQueueStats() {
  const waiting = await campaignQueue.getWaiting();
  const active = await campaignQueue.getActive();
  const completed = await campaignQueue.getCompleted();
  const failed = await campaignQueue.getFailed();
  
  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length
  };
}

// Clean completed jobs older than 24 hours
export async function cleanupJobs() {
  await campaignQueue.clean(24 * 60 * 60 * 1000, 'completed');
  await campaignQueue.clean(24 * 60 * 60 * 1000, 'failed');
}