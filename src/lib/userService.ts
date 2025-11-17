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
  phone_number?: string | null
  school?: string | null
  grade?: string | null
  date_of_birth?: string | null
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

    // Only register in AddedEmail table if explicitly requested by the User Management system
    // This prevents duplicate entries when creating users directly
    console.log('ℹ️ User created successfully WITHOUT AddedEmail registration - AddedEmail registration should be handled separately')

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
export async function addEmailToAddedEmail(
  email: string,
  firstName?: string,
  lastName?: string,
  phone_number?: string,
  school?: string,
  grade?: string,
  date_of_birth?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📝 Adding email to AddedEmail:', email)
    
    const { data: { user } } = await supabase.auth.getUser()
    const addedEmailData = {
      email: email.toLowerCase(),
      first_name: firstName || null,
      last_name: lastName || null,
      phone_number: phone_number || null,
      school: school || null,
      grade: grade || null,
      date_of_birth: date_of_birth || null,
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
  phone_number?: string
  school?: string
  grade?: string
  date_of_birth?: string
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
        
        // The CSV template has columns: id,email,first_name,last_name,phone_number,school,grade,date_of_birth,created_by,created_at,updated_at
        // We need to extract all profile fields while ignoring id and system columns
        if (fields.length < 2 || fields[1].trim() === '') {
          errors.push({ row: i + 2, error: 'Email field is required' })
          failed++
          continue
        }
// Field indices:
// 0: id, 1: email, 2: first_name, 3: last_name, 4: phone_number, 5: school, 6: grade, 7: date_of_birth, 8: created_by, 9: created_at, 10: updated_at
const emailFieldIndex = 1 // email is in the second column
const firstNameFieldIndex = 2 // first_name is in the third column
const lastNameFieldIndex = 3 // last_name is in the fourth column
const phoneNumberFieldIndex = 4 // phone_number is in the fifth column
const schoolFieldIndex = 5 // school is in the sixth column
const gradeFieldIndex = 6 // grade is in the seventh column
const dateOfBirthFieldIndex = 7 // date_of_birth is in the eighth column

const email = fields[emailFieldIndex] ? fields[emailFieldIndex].trim().toLowerCase() : ''
const firstName = fields[firstNameFieldIndex]?.trim() || null
const lastName = fields[lastNameFieldIndex]?.trim() || null
const phone_number = fields[phoneNumberFieldIndex]?.trim() || null
const school = fields[schoolFieldIndex]?.trim() || null
const grade = fields[gradeFieldIndex]?.trim() || null
const date_of_birth = fields[dateOfBirthFieldIndex]?.trim() || null

        
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
          phone_number: phone_number,
          school: school,
          grade: grade,
          date_of_birth: date_of_birth,
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
  const csvContent = 'id,email,first_name,last_name,phone_number,school,grade,date_of_birth,created_by,created_at,updated_at\n1,johndoe@example.com,John,Doe,+27629987561,Sandton High School,Grade 11,2005-03-15,system-user,2024-11-12T10:00:00Z,2024-11-12T10:00:00Z\n2,janesmith@example.com,Jane,Smith,+27769453218,Batswadi Secondary,Grade 10,2006-07-22,admin-user,2024-11-12T10:30:00Z,2024-11-12T10:30:00Z'
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

// Delete email from AddedEmail table by ID
export async function deleteEmailFromAddedEmail(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📝 Deleting email from AddedEmail with ID:', id)
    
    const { error } = await supabase
      .from('addedemail')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Error deleting AddedEmail entry:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email entry deleted successfully')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error in deleteEmailFromAddedEmail:', error)
    return { success: false, error: error.message }
  }
}

// Enhanced function to add email with optional authentication
export async function addEmailWithAuthentication(
  email: string,
  firstName?: string,
  lastName?: string,
  phone_number?: string,
  school?: string,
  grade?: string,
  date_of_birth?: string,
  includeAuthentication?: boolean,
  password?: string
): Promise<{
  success: boolean;
  addedEmailData?: any;
  authData?: {
    user: any;
    email: string;
    passwordDisplay: string;
    auth_created: boolean;
  };
  errors: string[];
  messages: string[];
}> {
  try {
    console.log('📝 Enhanced adding email with optional authentication:', email, 'auth-enabled:', includeAuthentication)
    
    const errors: string[] = []
    const messages: string[] = []

    // Step 1: Add to AddedEmail table (existing logic)
    const { data: currentUser } = await supabase.auth.getUser()
    const addedEmailInsert = {
      email: email.toLowerCase(),
      first_name: firstName || null,
      last_name: lastName || null,
      phone_number: phone_number || null,
      school: school || null,
      grade: grade || null,
      date_of_birth: date_of_birth || null,
      created_by: currentUser?.user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: insertedEmail, error: addedEmailError } = await supabase
      .from('addedemail')
      .insert(addedEmailInsert)
      .select('id, email, first_name, last_name')
      .single()

    let addedEmailData = insertedEmail

    if (addedEmailError) {
      // If duplicate email, don't treat as fatal error
      if (addedEmailError.code === '23505') {
        console.log(`ℹ️ Email ${email.toLowerCase()} already exists in AddedEmail table`)
        messages.push('Email already existed in AddedEmail table - data reused')
        
        // Get the existing entry
        const { data: existingEntry } = await supabase
          .from('addedemail')
          .select('*')
          .eq('email', email.toLowerCase())
          .single()
        addedEmailData = existingEntry
        
        // If we still can't get the entry after a duplicate error, something is wrong
        if (!addedEmailData) {
          console.error('❌ Cannot find existing email entry despite duplicate error')
          errors.push('System error: Could not retrieve existing email data')
          return { success: false, errors, messages }
        }
      } else {
        console.error('❌ Error adding to AddedEmail:', addedEmailError)
        errors.push('Failed to add to AddedEmail table: ' + addedEmailError.message)
        return { success: false, errors, messages }
      }
    }
    
    // TypeScript safe check - at this point addedEmailData should be available
    if (!addedEmailData) {
      console.error('❌ Cannot create auth user: AddedEmail data is not available after all checks')
      errors.push('System error: Email data is not available for authentication creation')
      return { success: false, errors, messages }
    }
    
    const authResult: any = {
      user: null,
      email: '',
      passwordDisplay: '',
      auth_created: false
    }

    // Step 2: If requested AND no errors so far, create authentication
    if (includeAuthentication && errors.length === 0) {
      try {

        const usePassword = password || generatePassword(12)
        authResult.email = email.toLowerCase()
        
        authResult.passwordDisplay = usePassword.endsWith(' (Generated)') ?
          usePassword :
          usePassword + (password ? ' (Custom)' : ' (Generated)')

        const authCall = await createAuthUserFromAddedEmail(
          addedEmailData,
          password || undefined // Only pass custom password if specified
        )

        if (authCall.success) {
          authResult.user = authCall.user
          authResult.auth_created = true
          messages.push('✅ Successfully created authentication user account')
          messages.push(`📋 Login details: ${email} / ${authResult.passwordDisplay}`)
        } else {
          if (authCall.error && authCall.error.includes('already exists')) {
            messages.push('ℹ️ Authentication user already exists (appears as verified)')
            authResult.passwordDisplay = 'Hidden (user exists in authentication)'
            authResult.auth_created = true
          } else {
            errors.push('Failed to create authentication: ' + (authCall.error || 'Unknown error'))
          }
        }

      } catch (authError: any) {
        const errorSafeMessage = authError.message?.toLowerCase() || ''
        console.error('❌ Error during authentication creation:', authError)
        if (errorSafeMessage.includes('already exists') || errorSafeMessage.includes('already registered')) {
          messages.push('⚠️ User authentication already existed (no changes made)')
          authResult.passwordDisplay = ''
        } else {
          errors.push('Final error for auth creation: ' + authError.message)
        }
      }
    } else if (includeAuthentication) {
      messages.push('🔄 Authentication creation was not attempted due to existing errors')
    }

    console.log('✅ Enhanced email process completed with', errors.length, 'errors and', messages.length, 'messages')
    const finalSuccess = errors.length === 0
    if (finalSuccess) messages.push('✅ Process completed successfully')

    return {
      success: finalSuccess,
      addedEmailData,
      authData: authResult.auth_created || authResult.user ? authResult : undefined,
      errors,
      messages
    }

  } catch (error: any) {
    console.error('❌ Overall error in addEmailWithAuthentication:', error)
    return {
      success: false,
      errors: [error.message || 'Unknown system error occurred'],
      messages: ['❌ Process failed due to system error']
    }
  }
}

// Check if email already exists in AddedEmail table before adding
export async function checkEmailExistsInAddedEmail(email: string): Promise<boolean> {
  try {
    console.log('📝 Checking if email exists in AddedEmail:', email)
    
    const { data: existingEmails, error } = await supabase
      .from('addedemail')
      .select('email')
      .eq('email', email.toLowerCase())

    if (error) {
      console.error('❌ Error checking email existence:', error)
      return false
    }

    const exists = existingEmails && existingEmails.length > 0
    console.log(`✅ Email check - Exists: ${exists}, Count: ${existingEmails?.length || 0}`)
    return exists
  } catch (error) {
    console.error('❌ Error in checkEmailExistsInAddedEmail:', error)
    return false
  }
}
// Add email to profiles table with authentication - creates full user profile
export async function addEmailToProfileTable(
  email: string,
  firstName?: string,
  lastName?: string,
  phone_number?: string,
  school?: string,
  grade?: string,
  date_of_birth?: string,
  password?: string,
  role: 'Learner' | 'Parent' | 'Tutor' | 'Other' = 'Learner'
): Promise<{
  success: boolean;
  profile?: any;
  authData?: {
    user: any;
    auth_created: boolean;
    passwordDisplay: string;
  };
  errors: string[];
  messages: string[];
}> {
  try {
    console.log('📝 Adding email to profiles table with authentication:', email)
    
    const errors: string[] = []
    const messages: string[] = []
    const usePassword: string | undefined = password

    // Step 1: Create authentication user
    let authUser: any = null
    let auth_created = false
    let passwordDisplay = ''

    try {
      const generatedPassword = usePassword || generatePassword(12)
      const authResult = await createUserWithEmail(
        email,
        generatedPassword,
        {
          first_name: firstName,
          last_name: lastName,
          phone_number: phone_number,
          role: role
        }
      )

      if (authResult.user) {
        authUser = authResult.user
        auth_created = true
        passwordDisplay = generatedPassword + (usePassword ? ' (Custom)' : ' (Generated)')
        messages.push('✅ Authentication user created successfully')
        messages.push(`📋 Login details: ${email} / ${passwordDisplay}`)
        
        // Now update profile with additional fields if provided
        if (authResult.user.id && (school || grade || date_of_birth)) {
          try {
            const updateData: any = {
              updated_at: new Date().toISOString()
            }
            if (school) updateData.school = school
            if (grade) updateData.grade = grade
            if (date_of_birth) updateData.date_of_birth = date_of_birth
            
            const { error: profileUpdateError } = await supabaseAdmin
              .from('profiles')
              .update(updateData)
              .eq('id', authResult.user.id)
              
            if (!profileUpdateError) {
              messages.push('✅ Profile with complete data updated successfully')
            }
          } catch (profileUpdateError: any) {
            console.warn('⚠️ Profile field update warning:', profileUpdateError)
          }
        }
      } else {
        errors.push('Failed to create authentication user: ' + (authResult.error?.message || 'Unknown error'))
        console.log('ℹ️ Attempting to proceed with profiles only due to existing user...')
        
        // Check if user already exists - we'll need to handle this case
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Use existing user if available
          authUser = user
        } else {
          throw new Error('Could not create or find existing user')
        }
      }
    } catch (authError: any) {
      const errorMessage = authError.message?.toLowerCase() || ''
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        messages.push('ℹ️ User authentication already existed')
        // Query to find existing user
        const { data: existingUser } = await supabase.auth.admin.getUserById(authUser?.id || email)
        if (existingUser) {
          authUser = existingUser
        }
      } else {
        errors.push('Authentication error: ' + authError.message)
      }
    }

    // Step 2: Add/update profile using the regular methods
    let profile: any = null
    if (errors.length === 0 && (authUser || messages.includes('already exists'))) {
      try {
        // Use the existing createUserWithEmail logic automatically handles profiles
        // But let's verify it exists
        const { data: existingProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', authUser?.id || email)
          .maybeSingle()

        if (existingProfile) {
          profile = existingProfile
          messages.push('✅ Existing profile verified/found')
        } else if (profileError) {
          console.warn('⚠️ Profile lookup warning:', profileError)
          messages.push('⚠️ Profile auto-creation may have failed but authentication successful')
        } else {
          messages.push('⚠️ Complete profile created but retrieval timed out')
        }
      } catch (profileError: any) {
        console.warn('❌ Profile lookup non-fatal error:', profileError)
        messages.push('⚠️ Profile creation/verification encountered non-fatal error')
      }
    }

    return {
      success: errors.length === 0,
      profile,
      authData: auth_created || authUser ? {
        user: authUser,
        auth_created,
        passwordDisplay
      } : undefined,
      errors,
      messages
    }
  } catch (error: any) {
    console.error('❌ Overall error in addEmailToProfileTable:', error)
    return {
      success: false,
      errors: [error.message || 'Unknown system error occurred'],
      messages: ['❌ Process failed due to system error']
    }
  }
}
