import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration if available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create client or mock for local development
let supabase: any

// Check if both environment variables are available
// Use relaxed validation to catch common placeholder patterns but allow actual URLs
const isPlaceholderUrl = (url: string | undefined): boolean => {
  if (!url) return true
  return url.includes('your_supabase_url') || 
         url.includes('your_project_url') ||
         url.includes('example.com') ||
         url === ''
}

const isPlaceholderKey = (key: string | undefined): boolean => {
  if (!key) return true
  return key.includes('your_supabase_anon_key') || 
         key.includes('your_project_key') ||
         key.length < 20
}

console.log('🔍 Supabase Configuration Check:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseKey: !!supabaseAnonKey,
  supabaseUrl: supabaseUrl ? (isPlaceholderUrl(supabaseUrl) ? 'PLACEHOLDER' : supabaseUrl.substring(0, 30) + '...') : 'missing',
  isPlaceholderUrl: isPlaceholderUrl(supabaseUrl),
  isPlaceholderKey: isPlaceholderKey(supabaseAnonKey)
})

// Use real Supabase connection if we have URL/key that don't appear to be placeholders
if (supabaseUrl && supabaseAnonKey && !isPlaceholderUrl(supabaseUrl) && !isPlaceholderKey(supabaseAnonKey)) {
  try {
    console.log('📊 Attempting to connect to Supabase...')
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Successfully connected to Supabase')
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error)
    console.warn('💡 Falling back to mock data')
    supabase = createMockClient()
  }
} else {
  console.warn('📊 Using local fallback data - Supabase placeholder detected')
  supabase = createMockClient()
}

// Create mock client for fallback/development
function createMockClient() {
  return {
    from: (table: string) => ({
      select: () => ({
        count: async () => Promise.resolve({ data: [], count: 0, error: null }),
        head: async () => Promise.resolve({ count: 0, error: null }),
        gte: () => ({
          select: async () => ({ data: [], count: 0, error: null })
        }),
        is: () => ({
          select: () => ({
            count: 'exact',
            head: async () => ({ count: 0, error: null })
          })
        })
      })
    }),
    rpc: async (functionName: string) => {
      // Provide mock RPC data for Overview page
      console.log(`📈 Mock RPC call: ${functionName}`)
      const mockData = functionName.includes('24h') ? { active_last_24h: 12 }
        : functionName.includes('7d') ? { active_last_7d: 68 }
        : { active_last_30d: 280 }
      return { data: mockData, error: null }
    }
  }
}

export { supabase }