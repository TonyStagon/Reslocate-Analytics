import { supabase, supabaseAdmin } from './supabase'

interface CreateUserResponse {
  user?: any
  error?: Error
}

interface UserData {
  id: string
  email: string
  created_at: string
}


export interface AddedEmail {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}


// Generate a random secure password
export function generatePassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$'
  let password = ''
  const charsetLength = charset.length
  const cryptoArray = new Uint8Array(length)
  crypto.getRandomValues(cryptoArray)
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(cryptoArray[i] % charsetLength)
  }
  return password
}

// Create user with email confirmation bypass
export async function createUserWithEmail(
  email: string, 
  password: string, 
  profileData?: {
    first_name?: string
    last_name?: string
    phone_number?: string
    role?: 'Learner' | 'Parent' | 'Tutor' | 'Other'
  }
): Promise<CreateUserResponse> {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    console.log('📝 Creating user with email:', email)

    // Use admin client to create user with service role key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { created_by_admin: true }
    })

    if (authError) {
      console.error('❌ Auth Error:', authError)
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        throw new Error('User with this email already exists')
      }
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Failed to create user - no user data returned')
    }

    console.log('✅ User created in auth system:', authData.user.id)

    // Create corresponding profile entry using the regular client
    const profileInsertData = {
      id: authData.user.id,
      email: email.toLowerCase(),
      role: profileData?.role || 'Learner',
      first_name: profileData?.first_name || '',
      last_name: profileData?.last_name || '',
      phone_number: profileData?.phone_number || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileInsertData, {
        onConflict: 'id'
      })

    if (profileError) {
      console.warn('⚠️ Profile creation warning:', profileError)
      // Don't throw here since user was created successfully in auth
    } else {
      console.log('✅ Profile created successfully')
    }

    // Insert into AddedEmail table to track user creation
    const addedEmailData = {
      email: email.toLowerCase(),
      first_name: profileData?.first_name || null,
      last_name: profileData?.last_name || null,
      created_by: authData.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Try to insert, and gracefully handle duplicate emails
    const { data: insertedEmail, error: addedEmailError } = await supabase
      .from('addedemail')
      .insert(addedEmailData)
      .select('id, email')
      .single()

    if (addedEmailError) {
      // If duplicate email, this is expected and we should just continue
      if (addedEmailError.code === '23505') {
        console.log(`ℹ️ Email ${email.toLowerCase()} already exists in AddedEmail table - this is expected behavior`)
      } else {
        console.warn('⚠️ AddedEmail tracking warning:', addedEmailError)
        console.log('❌ Raw AddedEmail insert error details:', addedEmailError)
      }
      // Don't throw here since user was created successfully in auth system
    } else {
      console.log('✅ AddedEmail record created successfully:', insertedEmail)
    }

    return { user: authData.user }
  } catch (error: any) {
    console.error('❌ User Creation Error:', error)
    return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
  }
}

// Fetch recently created users (last 10)
export async function getRecentUsers(): Promise<UserData[]> {
  try {
    console.log('📝 Fetching recent users...')
    
    // Check if user is authenticated (for debugging)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('⚠️ No session found - user not authenticated')
      console.log('Please ensure you are logged in to access user data')
    }

    console.log('📝 Fetching profiles from database via admin client...');

    // Use admin client to fetch users (assuming profiles are stored in 'profiles' table)
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Database Error:', error)
      throw error
    }

    console.log(`✅ Retrieved ${users?.length || 0} users`)
    return users || []
  } catch (error: any) {
    console.error('❌ Error fetching recent users:', error)
    
    // Provide more specific error message
    const errorMessage = error.message || error.details || JSON.stringify(error)
    console.error('❌ Error details:', errorMessage)
    
    return []
  }
}

// Get all user profiles
export async function getUserProfile(): Promise<any[]> {
  try {
    console.log('📝 Fetching all user profiles...')
    
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching profiles:', error)
      throw error
    }

    console.log(`✅ Retrieved ${profiles?.length || 0} profiles`)
    return profiles || []
  } catch (error) {
    console.error('❌ Error in getUserProfile:', error)
    return []
  }
}

// Update user profile
export async function updateUserProfile(profileId: string, profileData: any): Promise<void> {
  try {
    console.log('📝 Updating profile:', profileId)
    
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)

    if (error) {
      console.error('❌ Error updating profile:', error)
      throw error
    }

    console.log('✅ Profile updated successfully')
  } catch (error) {
    console.error('❌ Error in updateUserProfile:', error)
    throw error
  }
}

// Add email to AddedEmail table
export async function addEmailToAddedEmail(email: string, firstName?: string, lastName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📝 Adding email to AddedEmail:', email)
    
    const { data: { user } } = await supabase.auth.getUser()
    const addedEmailData = {
      email: email.toLowerCase(),
      first_name: firstName || null,
      last_name: lastName || null,
      created_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: insertedEmail, error } = await supabase
      .from('addedemail')
      .insert(addedEmailData)
      .select('id, email')
      .single()

    if (error) {
      // If it's a duplicate email error, don't treat it as a failure
      if (error.code === '23505') {
        console.log(`ℹ️ Email ${email.toLowerCase()} already exists in AddedEmail table`)
        return {
          success: true,
          error: `Email ${email.toLowerCase()} already exists in the system`
        }
      }
      
      console.error('❌ Error adding to AddedEmail - Complete error dump:')
      console.log('Error Code:', error.code)
      console.log('Error Message:', error.message)
      console.log('Error Details:', error.details)
      console.log('Error Hint:', error.hint)
      console.log('Full Error Object:', error)
      
      return { success: false, error: error.message || 'Unknown database error' }
    }

    console.log('✅ Email added to AddedEmail successfully')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error in addEmailToAddedEmail:', error)
    // If it's a duplicate constraint, return success since email already tracked
    if (error.code === '23505' || error.details?.includes('duplicate')) {
      return { success: true, error: `Email already exists in the system` }
    }
    return { success: false, error: error.message }
  }
}

// Get all added emails
export async function getAllAddedEmails(): Promise<AddedEmail[]> {
  try {
    console.log('📝 Fetching all added emails...')
    
    const { data: addedEmails, error } = await supabase
      .from('addedemail')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching added emails:', error)
      throw error
    }

    console.log(`✅ Retrieved ${addedEmails?.length || 0} added emails`)
    return addedEmails || []
  } catch (error) {
    console.error('❌ Error in getAllAddedEmails:', error)
    return []
  }
}

// Create auth user from AddedEmail entry
export async function createAuthUserFromAddedEmail(
  emailEntry: AddedEmail,
  password?: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    console.log('📝 Creating auth user from AddedEmail:', emailEntry.email)
    
    // If no password provided, generate one
    const userPassword = password || generatePassword(12)
    
    const { user } = await createUserWithEmail(
      emailEntry.email,
      userPassword,
      {
        first_name: emailEntry.first_name || '',
        last_name: emailEntry.last_name || '',
        role: 'Learner' // Default role
      }
    )

    if (!user) {
      throw new Error('Failed to create auth user')
    }

    console.log('✅ Auth user created successfully:', user.id)
    return { success: true, user: user }
  } catch (error: any) {
    console.error('❌ Error creating auth user from AddedEmail:', error)
    // Check if user already exists
    if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
      return {
        success: true,
        error: `User with email ${emailEntry.email} already exists in authentication system`
      }
    }
    return { success: false, error: error.message }
  }
}

// Check authentication status for AddedEmail entries
export async function getAuthUserStatus(emails: string[]): Promise<{[email: string]: boolean}> {
  try {
    console.log('📝 Checking auth status for emails:', emails)
    
    // Use admin client to check auth users by email
    const { data: authUsers, error } = await supabaseAdmin
      .from('auth.users')
      .select('email')
      .in('email', emails.map(email => email.toLowerCase()))

    if (error) {
      console.error('❌ Error checking auth users:', error)
      return {}
    }

    const emailStatus: {[email: string]: boolean} = {}
    const authEmails = new Set(authUsers?.map(user => user.email.toLowerCase()) || [])
    
    emails.forEach(email => {
      emailStatus[email] = authEmails.has(email.toLowerCase())
    })

    console.log('✅ Auth status check completed')
    return emailStatus
  } catch (error) {
    console.error('❌ Error in getAuthUserStatus:', error)
    return {}
  }
}

// Create auth users for multiple AddedEmail entries
export async function bulkCreateAuthUsers(
  emailEntries: AddedEmail[]
): Promise<{
  success: boolean;
  created: string[];
  skipped: string[];
  errors: Array<{ email: string; error: string }>
}> {
  try {
    console.log('📝 Bulk creating auth users for', emailEntries.length, 'emails')
    
    const created: string[] = []
    const skipped: string[] = []
    const errors: Array<{ email: string; error: string }> = []

    for (const entry of emailEntries) {
      const result = await createAuthUserFromAddedEmail(entry)
      if (result.success) {
        created.push(entry.email)
      } else {
        errors.push({ email: entry.email, error: result.error || 'Unknown error' })
      }
    }

    if (errors.length === 0) {
      console.log('✅ Bulk user creation completed:', { created: created.length })
    } else {
      console.log('⚠️ Bulk user creation completed with errors:', {
        created: created.length,
        errors: errors.length
      })
    }

    return {
      success: errors.length === emailEntries.length ? false : true,
      created,
      skipped,
      errors
    }
  } catch (error: any) {
    console.error('❌ Error in bulkCreateAuthUsers:', error)
    return {
      success: false,
      created: [],
      skipped: [],
      errors: emailEntries.map(entry => ({
        email: entry.email,
        error: error.message
      }))
    }
  }
}

// Import emails from CSV file
export interface CSVEmailData {
  email: string
  first_name?: string
  last_name?: string
}

export async function importEmailsFromCSV(file: File): Promise<{
  success: boolean;
  processed: number;
  duplicates: number;
  failed: number;
  errors: Array<{ row: number; error: string }>
}> {
  try {
    console.log('📝 Processing CSV file:', file.name)
    
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    // Skip header row and process data rows
    const dataLines = lines.slice(1) // Skip header row
    let processed = 0
    let duplicates = 0
    let failed = 0
    const errors: Array<{ row: number; error: string }> = []
    const { data: { user } } = await supabase.auth.getUser()

    // Validate and process each row
    for (let i = 0; i < dataLines.length; i++) {
      try {
        const line = dataLines[i].trim()
        if (!line) continue // Skip empty lines
        
        const fields = line.split(',')
        
        // The CSV template has columns: id,email,first_name,last_name,created_by,created_at,updated_at
        // We need to extract email, first_name, and last_name while ignoring other columns
        if (fields.length < 2 || fields[1].trim() === '') {
          errors.push({ row: i + 2, error: 'Email field is required' })
          failed++
          continue
        }

        // Field indices:
        // 0: id, 1: email, 2: first_name, 3: last_name, 4: created_by, 5: created_at, 6: updated_at
        const emailFieldIndex = 1 // email is in the second column
        const firstNameFieldIndex = 2 // first_name is in the third column
        const lastNameFieldIndex = 3 // last_name is in the fourth column

        const email = fields[emailFieldIndex] ? fields[emailFieldIndex].trim().toLowerCase() : ''
        const firstName = fields[firstNameFieldIndex]?.trim() || null
        const lastName = fields[lastNameFieldIndex]?.trim() || null
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email || !emailRegex.test(email)) {
          errors.push({ row: i + 2, error: 'Invalid email format' })
          failed++
          continue
        }

        const addedEmailData = {
          email,
          first_name: firstName,
          last_name: lastName,
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('addedemail')
          .insert(addedEmailData)

        if (error) {
          if (error.code === '23505') {
            // Duplicate email - count but don't consider as failure
            console.log(`ℹ️ Email ${email} already exists`)
            duplicates++
          } else {
            console.error(`❌ Error inserting email ${email}:`, error)
            errors.push({ row: i + 2, error: error.message })
            failed++
          }
        } else {
          processed++
        }

      } catch (rowError: any) {
        console.error(`❌ Error processing row ${i + 2}:`, rowError)
        errors.push({ row: i + 2, error: rowError.message || 'Invalid row format' })
        failed++
      }
    }

    console.log(`✅ CSV import completed - Processed: ${processed}, Duplicates: ${duplicates}, Failed: ${failed}`, errors)
    return {
      success: errors.length === 0,
      processed,
      duplicates,
      failed,
      errors
    }
  } catch (error: any) {
    console.error('❌ Error in importEmailsFromCSV:', error)
    return {
      success: false,
      processed: 0,
      duplicates: 0,
      failed: 0,
      errors: [{ row: 0, error: error.message }]
    }
  }
}

// Utility to download CSV template
export function downloadCSVTemplate(): void {
  const csvContent = 'id,email,first_name,last_name,created_by,created_at,updated_at\n1,johndoe@example.com,John,Doe,system-user,2024-11-12T10:00:00Z,2024-11-12T10:00:00Z\n2,janesmith@example.com,Jane,Smith,admin-user,2024-11-12T10:30:00Z,2024-11-12T10:30:00Z'
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'email_import_template.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Copy to clipboard utility
export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return Promise.resolve(successful)
    } catch {
      document.body.removeChild(textArea)
      return Promise.resolve(false)
    }
  }
}