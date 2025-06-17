import { Pool } from 'pg';

async function testSupabaseDirectly() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.oolcnbxrnuefxfdpvsfn:dsadasSDASdsaDASDASasdsadas3434@aws-0-eu-north-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false },
    max: 1
  });

  try {
    console.log('🔍 Testing direct Supabase connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Test cohorts query
    console.log('\n📊 Testing cohorts table...');
    const cohortsResult = await client.query('SELECT COUNT(*) as count FROM cohorts');
    console.log(`Total cohorts: ${cohortsResult.rows[0].count}`);
    
    if (cohortsResult.rows[0].count > 0) {
      const sampleCohorts = await client.query('SELECT id, name, description, status FROM cohorts LIMIT 3');
      console.log('\n🔍 Sample cohorts:');
      sampleCohorts.rows.forEach(cohort => {
        console.log(`- ${cohort.name} (${cohort.status}): ${cohort.description || 'No description'}`);
      });
    }
    
    // Test segments query
    console.log('\n📊 Testing segments table...');
    const segmentsResult = await client.query('SELECT COUNT(*) as count FROM segments');
    console.log(`Total segments: ${segmentsResult.rows[0].count}`);
    
    if (segmentsResult.rows[0].count > 0) {
      const sampleSegments = await client.query('SELECT id, name, description, status FROM segments LIMIT 3');
      console.log('\n🔍 Sample segments:');
      sampleSegments.rows.forEach(segment => {
        console.log(`- ${segment.name} (${segment.status}): ${segment.description || 'No description'}`);
      });
    }
    
    // Test campaigns query
    console.log('\n📊 Testing campaigns table...');
    const campaignsResult = await client.query('SELECT COUNT(*) as count FROM campaigns');
    console.log(`Total campaigns: ${campaignsResult.rows[0].count}`);
    
    if (campaignsResult.rows[0].count > 0) {
      const sampleCampaigns = await client.query('SELECT id, name, description, status FROM campaigns LIMIT 3');
      console.log('\n🔍 Sample campaigns:');
      sampleCampaigns.rows.forEach(campaign => {
        console.log(`- ${campaign.name} (${campaign.status}): ${campaign.description || 'No description'}`);
      });
    }
    
    client.release();
    console.log('\n✅ All database tests passed! Data is available.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testSupabaseDirectly().catch(console.error); 