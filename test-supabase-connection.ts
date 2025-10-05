// Supabase Connection Test
// Run this file to verify Supabase is properly connected

import { supabase } from './lib/supabase'

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  // Test 1: Check environment variables
  console.log('1️⃣ Environment Variables:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('')

  // Test 2: Basic connection test
  console.log('2️⃣ Connection Test:')
  try {
    const { data, error } = await supabase
      .from('source_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('   ❌ Connection failed:', error.message)
      return false
    }
    console.log('   ✅ Connection successful!')
    console.log('')
  } catch (err) {
    console.log('   ❌ Connection error:', err)
    return false
  }

  // Test 3: Query test
  console.log('3️⃣ Query Test:')
  try {
    const { data, error } = await supabase
      .from('source_profiles')
      .select('id, username')
      .limit(5)
    
    if (error) {
      console.log('   ❌ Query failed:', error.message)
      return false
    }
    console.log('   ✅ Query successful!')
    console.log(`   Found ${data?.length || 0} profiles`)
    if (data && data.length > 0) {
      console.log('   Sample data:', data[0])
    }
    console.log('')
  } catch (err) {
    console.log('   ❌ Query error:', err)
    return false
  }

  // Test 4: Insert test
  console.log('4️⃣ Insert Test:')
  try {
    const testId = crypto.randomUUID()
    const testUsername = `test_connection_${Date.now()}`
    
    const { data, error } = await supabase
      .from('source_profiles')
      .insert([{ id: testId, username: testUsername }])
      .select()
    
    if (error) {
      console.log('   ❌ Insert failed:', error.message)
      return false
    }
    console.log('   ✅ Insert successful!')
    
    // Clean up test data
    await supabase
      .from('source_profiles')
      .delete()
      .eq('id', testId)
    
    console.log('   ✅ Test data cleaned up')
    console.log('')
  } catch (err) {
    console.log('   ❌ Insert error:', err)
    return false
  }

  console.log('🎉 All tests passed! Supabase is properly connected.')
  return true
}

// Run the test
testSupabaseConnection()
  .then((success) => {
    if (!success) {
      console.log('\n❌ Supabase connection test failed!')
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error('\n❌ Test execution error:', err)
    process.exit(1)
  })
