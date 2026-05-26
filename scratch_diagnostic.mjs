import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vqyneoyhusbjetodsbzu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeW5lb3lodXNiamV0b2RzYnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTE2NTQsImV4cCI6MjA5NDE2NzY1NH0.sKzdLi4eHI4xJi6IyFSCe4l1EHGmCOubWJZJfd-ezQY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  console.log("Fetching a sample row from user_config...")
  const { data, error } = await supabase.from('user_config').select('*').limit(1)
  if (error) {
    console.error("❌ Error querying user_config:", error.message, error.code)
  } else if (data && data.length > 0) {
    console.log("✅ Success! Columns in user_config:")
    console.log(Object.keys(data[0]))
    console.log("\nSample Row Data:")
    console.log(JSON.stringify(data[0], null, 2))
  } else {
    console.log("ℹ️ No rows found in user_config.")
  }
}

check()
