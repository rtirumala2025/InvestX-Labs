import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumn() {
  try {
    console.log('🔍 Testing if purchase_price column exists...');
    
    // Try to query with purchase_price
    const { data, error } = await supabase
      .from('holdings')
      .select('id,portfolio_id,symbol,shares,purchase_price,current_price')
      .limit(1);
    
    if (error) {
      if (error.code === '42703' && error.message?.includes('purchase_price')) {
        console.error('❌ Column purchase_price does NOT exist');
        console.error('Error:', error.message);
        return false;
      } else {
        console.error('❌ Query error:', error);
        return false;
      }
    }
    
    console.log('✅ Column purchase_price EXISTS');
    console.log('✅ Query successful');
    if (data && data.length > 0) {
      console.log('✅ Sample data:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('ℹ️  No holdings found (table is empty, but column exists)');
    }
    return true;
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    return false;
  }
}

testColumn().then(success => {
  process.exit(success ? 0 : 1);
});
