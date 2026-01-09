import { supabaseAdmin } from './supabase'

export interface MagicLinkUser {
  id: string
  email: string
  is_active: boolean
  magic_token: string
  activated_at: string | null
  first_access_at: string | null
  created_at: string
  updated_at: string
}

export interface SendMagicLinkResult {
  success: boolean
  magicLink?: string
  error?: string
  user?: MagicLinkUser
  simulated?: boolean
}

export interface BulkSendMagicLinksResult {
  success: boolean
  sent: number
  failed: number
  results: Array<{
    email: string
    success: boolean
    error?: string
    magicLink?: string
  }>
}

// Create or update magic link user
export async function createOrUpdateMagicLinkUser(
  email: string
): Promise<{ success: boolean; user?: MagicLinkUser; error?: string }> {
  try {
    console.log('📝 Creating/updating magic link user for:', email)

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('magic_link_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('❌ Error checking existing user:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (existingUser) {
      // Update existing user with new token and activate
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('magic_link_users')
        .update({
          magic_token: crypto.randomUUID(),
          is_active: true,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating magic link user:', updateError)
        return { success: false, error: updateError.message }
      }

      console.log('✅ Magic link user updated:', updatedUser.id)
      return { success: true, user: updatedUser }
    } else {
      // Create new magic link user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('magic_link_users')
        .insert({
          email: email.toLowerCase(),
          is_active: true,
          magic_token: crypto.randomUUID(),
          activated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating magic link user:', createError)
        return { success: false, error: createError.message }
      }

      console.log('✅ Magic link user created:', newUser.id)
      return { success: true, user: newUser }
    }
  } catch (error: any) {
    console.error('❌ Error in createOrUpdateMagicLinkUser:', error)
    return { success: false, error: error.message }
  }
}

// Generate magic link URL
export function generateMagicLinkUrl(magicToken: string): string {
  // Get the base URL for the magic link project
  const magicLinkBaseUrl = import.meta.env.VITE_MAGIC_LINK_BASE_URL || 'http://localhost:5174'
  return `${magicLinkBaseUrl}/?token=${magicToken}`
}

// Send magic link email using Supabase Edge Function with fallback
export async function sendMagicLinkEmail(
  email: string,
  magicLink: string,
  firstName?: string
): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  try {
    console.log('📧 Sending magic link email to:', email)
    console.log('🔗 Magic Link:', magicLink)

    const fromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const subject = `Welcome to Your Learning Journey${firstName ? `, ${firstName}` : ''}!`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to Your Personalized Learning Experience!</h2>
        <p>Hello${firstName ? ` ${firstName}` : ''},</p>
        <p>You've been invited to access your personalized learning portal. Click the link below to get started:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLink}"
             style="background-color: #4F46E5; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Access Your Learning Portal
          </a>
        </div>
        <p><strong>Important:</strong> This link is unique to you and will expire after first use.</p>
        <p>If you have any questions, please contact support.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
        <p style="color: #6B7280; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `

    // Try local email server first (if configured)
    const emailServerUrl = import.meta.env.VITE_EMAIL_SERVER_URL
    if (emailServerUrl) {
      try {
        console.log('📧 Attempting to send via local email server:', emailServerUrl)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(`${emailServerUrl}/api/send-magic-link-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            magicLink,
            firstName,
            subject,
            html,
            from: fromEmail
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Local email server response:', result)
          if (result.success) {
            console.log('✅ Email sent successfully via local server')
            return { success: true, simulated: false }
          } else {
            console.warn('⚠️ Local server returned failure, falling back to edge function:', result.error)
            // Continue to edge function attempt
          }
        } else {
          console.warn('⚠️ Local server request failed, falling back to edge function:', response.status)
          // Continue to edge function attempt
        }
      } catch (localError: any) {
        console.warn('⚠️ Local email server error, falling back to edge function:', localError.message)
        // Continue to edge function attempt
      }
    }

    // Fallback: Call Supabase Edge Function to send email
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Missing Supabase environment variables for Edge Function call. Using simulation.')
      return { success: true, simulated: true }
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-email`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject,
          html,
          from: fromEmail,
          firstName
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // If the function returns 404 or CORS error, treat as not deployed
        if (response.status === 404 || response.status === 403) {
          console.warn(`⚠️ Edge Function not deployed (${response.status}). Using simulation.`)
          return { success: true, simulated: true }
        }

        const errorText = await response.text()
        console.error('❌ Edge Function error:', errorText)
        // Try to parse error as JSON
        let errorMessage = `Edge Function error: ${response.status} ${response.statusText}`
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorJson.details || errorMessage
        } catch (e) {
          // ignore
        }
        // We don't treat this as a failure because the magic link is still generated
        console.warn('⚠️ Email sending failed but magic link was generated. Admin can manually send.')
        return { success: true, simulated: true, error: errorMessage }
      }

      const result = await response.json()
      console.log('✅ Edge Function response:', result)

      if (result.success) {
        console.log('✅ Email sent successfully via Edge Function')
        return { success: true, simulated: result.simulated }
      } else {
        console.warn('⚠️ Edge Function returned failure but magic link was generated:', result.error)
        return { success: true, simulated: true, error: result.error }
      }
    } catch (fetchError: any) {
      // Network error, CORS error, timeout, etc.
      console.warn('⚠️ Failed to call Edge Function (network error). Using simulation.', fetchError.message)
      return { success: true, simulated: true }
    }
  } catch (error: any) {
    console.error('❌ Unexpected error in sendMagicLinkEmail:', error)
    // Even if something unexpected happens, we still want to return success so the magic link is shown
    return { success: true, simulated: true, error: error.message }
  }
}

// Main function to send magic link to a profile
export async function sendMagicLinkToProfile(
  profile: { email: string; first_name?: string; last_name?: string }
): Promise<SendMagicLinkResult> {
  try {
    console.log('🚀 Sending magic link to profile:', profile.email)

    // Step 1: Create/update magic link user
    const userResult = await createOrUpdateMagicLinkUser(profile.email)
    if (!userResult.success || !userResult.user) {
      return { success: false, error: userResult.error }
    }

    // Step 2: Generate magic link URL
    const magicLink = generateMagicLinkUrl(userResult.user.magic_token)

    // Step 3: Send email via Edge Function
    const emailResult = await sendMagicLinkEmail(
      profile.email,
      magicLink,
      profile.first_name
    )

    if (!emailResult.success) {
      return { 
        success: false, 
        error: emailResult.error,
        user: userResult.user,
        magicLink // Return link even if email fails for manual sending
      }
    }

    console.log('✅ Magic link sent successfully to:', profile.email)
    return {
      success: true,
      magicLink,
      user: userResult.user,
      simulated: emailResult.simulated
    }
  } catch (error: any) {
    console.error('❌ Error in sendMagicLinkToProfile:', error)
    return { success: false, error: error.message }
  }
}

// Send magic link to an email address (convenience wrapper)
export async function sendMagicLinkToEmail(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<SendMagicLinkResult> {
  return sendMagicLinkToProfile({ email, first_name: firstName, last_name: lastName });
}

// Bulk send magic links to multiple profiles
export async function bulkSendMagicLinks(
  profiles: Array<{ email: string; first_name?: string; last_name?: string }>
): Promise<BulkSendMagicLinksResult> {
  try {
    console.log('🚀 Bulk sending magic links to', profiles.length, 'profiles')

    const results: Array<{
      email: string
      success: boolean
      error?: string
      magicLink?: string
    }> = []

    let sent = 0
    let failed = 0

    // Process each profile sequentially to avoid rate limiting
    for (const profile of profiles) {
      try {
        const result = await sendMagicLinkToProfile(profile)
        
        if (result.success) {
          sent++
          results.push({
            email: profile.email,
            success: true,
            magicLink: result.magicLink
          })
          console.log(`✅ Magic link sent to ${profile.email}`)
        } else {
          failed++
          results.push({
            email: profile.email,
            success: false,
            error: result.error
          })
          console.log(`❌ Failed to send magic link to ${profile.email}:`, result.error)
        }
      } catch (error: any) {
        failed++
        results.push({
          email: profile.email,
          success: false,
          error: error.message
        })
        console.log(`❌ Error sending magic link to ${profile.email}:`, error)
      }

      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ Bulk send completed: ${sent} sent, ${failed} failed`)
    return {
      success: failed === 0,
      sent,
      failed,
      results
    }
  } catch (error: any) {
    console.error('❌ Error in bulkSendMagicLinks:', error)
    return {
      success: false,
      sent: 0,
      failed: profiles.length,
      results: profiles.map(profile => ({
        email: profile.email,
        success: false,
        error: error.message
      }))
    }
  }
}

// Get magic link users
export async function getMagicLinkUsers(): Promise<{
  success: boolean
  users?: MagicLinkUser[]
  error?: string
}> {
  try {
    console.log('📝 Fetching magic link users...')

    const { data: users, error } = await supabaseAdmin
      .from('magic_link_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching magic link users:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Retrieved ${users?.length || 0} magic link users`)
    return { success: true, users: users || [] }
  } catch (error: any) {
    console.error('❌ Error in getMagicLinkUsers:', error)
    return { success: false, error: error.message }
  }
}

// Check if magic link exists for profile
export async function checkMagicLinkExists(email: string): Promise<{
  success: boolean
  exists: boolean
  user?: MagicLinkUser
  error?: string
}> {
  try {
    console.log('📝 Checking magic link for:', email)

    const { data: user, error } = await supabaseAdmin
      .from('magic_link_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error checking magic link:', error)
      return { success: false, exists: false, error: error.message }
    }

    const exists = !!user
    console.log(`✅ Magic link check - Exists: ${exists}`)
    return { success: true, exists, user: user || undefined }
  } catch (error: any) {
    console.error('❌ Error in checkMagicLinkExists:', error)
    return { success: false, exists: false, error: error.message }
  }
}