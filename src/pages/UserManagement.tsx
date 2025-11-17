import React, { useState, useEffect } from 'react'
import { Mail, Lock, Copy, AlertCircle, CheckCircle, RefreshCw, Users, Loader, UserPlus, Edit, Save, X, Plus, Trash2, FileText, Upload, Download, ShieldCheck, User } from 'lucide-react'
import {
  createUserWithEmail,
  generatePassword,
  getRecentUsers,
  copyToClipboard,
  updateUserProfile,
  getUserProfile,
  addEmailToAddedEmail,
  getAllAddedEmails,
  importEmailsFromCSV,
  downloadCSVTemplate,
  createAuthUserFromAddedEmail,
  getAuthUserStatus,
  bulkCreateAuthUsers,
  deleteEmailFromAddedEmail,
  checkEmailExistsInAddedEmail,
  addEmailWithAuthentication,
  addEmailToProfileTable
} from '../lib/userService'
import type { Profile } from '../types/database'
import { AddedEmail } from '../lib/userService'

interface UserData {
  id: string
  email: string
  created_at: string
}

interface CreateUserFormData {
  email: string
  first_name: string
  last_name: string
  phone_number: string
  role: 'Learner' | 'Parent' | 'Tutor' | 'Other'
}

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<'create' | 'profiles' | 'addedEmails'>('create')
  
  // Email Duplicate Prevention States
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  
  // Create User Form States
  const [userFormData, setUserFormData] = useState<CreateUserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'Learner'
  })
  const [passwordOption, setPasswordOption] = useState<'auto' | 'custom'>('auto')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [customPassword, setCustomPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  
  // Profile Management States
  const [recentUsers, setRecentUsers] = useState<UserData[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)
  const [editProfileData, setEditProfileData] = useState<Partial<Profile>>({})
  
  // AddedEmail Management States
  const [addedEmails, setAddedEmails] = useState<AddedEmail[]>([])
  const [loadingAddedEmails, setLoadingAddedEmails] = useState(false)
  const [authStatusMap, setAuthStatusMap] = useState<{[email: string]: boolean}>({})
  const [authenticatingEmail, setAuthenticatingEmail] = useState<string | null>(null)
  const [bulkAuthenticating, setBulkAuthenticating] = useState(false)
  const [addEmailForm, setAddEmailForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    school: '',
    grade: '',
    date_of_birth: '',
    include_authentication: false,
    password_option: 'auto',
    custom_password: '',
    storage_destination: 'addedemail' as 'addedemail' | 'profile' | 'both_tables'
  })
  const [addingEmail, setAddingEmail] = useState(false)
  const [generatedAddEmailPassword, setGeneratedAddEmailPassword] = useState('')
  const [addEmailPasswordCopied, setAddEmailPasswordCopied] = useState(false)
  const [deletingEmailId, setDeletingEmailId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  
  // CSV Import States
  const [csvImportFile, setCsvImportFile] = useState<File | null>(null)
  const [importingCSV, setImportingCSV] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: boolean;
    processed: number;
    duplicates: number;
    failed: number;
    errors: Array<{ row: number; error: string }>
  } | null>(null)
  
  const [touched, setTouched] = useState({ 
    email: false, 
    customPassword: false,
    first_name: false,
    last_name: false 
  })
  const [submitted, setSubmitted] = useState(false)

  // Validation functions
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidPassword = (password: string) => password.length >= 6
  const isValidName = (name: string) => name.trim().length >= 2

  // Form validation
  const emailError = touched.email && !userFormData.email ? 'Email is required' : 
                     touched.email && !isValidEmail(userFormData.email) ? 'Invalid email format' : ''
  
  const firstNameError = touched.first_name && !userFormData.first_name ? 'First name is required' :
                        touched.first_name && !isValidName(userFormData.first_name) ? 'First name must be at least 2 characters' : ''

  const lastNameError = touched.last_name && !userFormData.last_name ? 'Last name is required' :
                       touched.last_name && !isValidName(userFormData.last_name) ? 'Last name must be at least 2 characters' : ''
  
  const customPasswordError = touched.customPassword && !customPassword ? 'Password is required' : 
                              touched.customPassword && !isValidPassword(customPassword) ? 
                              'Password must be at least 6 characters' : ''

  const canSubmit = userFormData.email && isValidEmail(userFormData.email) && 
                   userFormData.first_name && isValidName(userFormData.first_name) &&
                   userFormData.last_name && isValidName(userFormData.last_name) &&
                   (passwordOption === 'auto' || (customPassword && isValidPassword(customPassword)))

  // Initialize generated password and fetch recent users
  useEffect(() => {
    handleGeneratePassword()
    fetchRecentUsers()
    
    if (activeTab === 'profiles') {
      fetchProfiles()
    } else if (activeTab === 'addedEmails') {
      fetchAddedEmails()
    }
  }, [activeTab])

  const fetchRecentUsers = async () => {
    try {
      const users = await getRecentUsers()
      setRecentUsers(users)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchProfiles = async () => {
    setLoadingProfiles(true)
    try {
      const profilesData = await getUserProfile()
      setProfiles(profilesData || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = generatePassword()
    setGeneratedPassword(newPassword)
    setCopiedPassword(false)
  }

  const handleCopyPassword = async () => {
    const success = await copyToClipboard(generatedPassword)
    if (success) {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const handleFieldBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const clearForm = () => {
    setUserFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      role: 'Learner'
    })
    setGeneratedPassword('')
    setCustomPassword('')
    setTouched({ email: false, customPassword: false, first_name: false, last_name: false })
    setSubmitted(false)
    setPasswordOption('auto')
    handleGeneratePassword()
  }

  const handleInputChange = (field: keyof CreateUserFormData, value: string) => {
    setUserFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTouched({ 
      email: true, 
      first_name: true, 
      last_name: true,
      customPassword: passwordOption === 'custom' 
    })

    if (!canSubmit) return

    setLoading(true)
    setMessage(null)

    try {
      const passwordToUse = passwordOption === 'auto' ? generatedPassword : customPassword
      const response = await createUserWithEmail(userFormData.email, passwordToUse, userFormData)

      if (response.error) {
        throw response.error
      }

      setMessage({
        text: `User ${userFormData.email} created successfully! The user can now log in with their email and chosen password.`,
        type: 'success'
      })

      // Refresh recent users list
      await fetchRecentUsers()
      
      // Reset form after successful creation
      setTimeout(() => {
        clearForm()
      }, 2000)

    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to create user',
        type: 'error'
      })
    } finally {
      setLoading(false)
      setSubmitted(false)
    }
  }

  const handleEditProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId)
    if (profile) {
      setEditingProfile(profileId)
      setEditProfileData({ ...profile })
    }
  }

  const handleSaveProfile = async (profileId: string) => {
    try {
      await updateUserProfile(profileId, editProfileData)
      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, ...editProfileData } : p
      ))
      setEditingProfile(null)
      setEditProfileData({})
      setMessage({
        text: 'Profile updated successfully!',
        type: 'success'
      })
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to update profile',
        type: 'error'
      })
    }
  }

  const fetchAddedEmails = async () => {
    setLoadingAddedEmails(true)
    try {
      const emailsData = await getAllAddedEmails()
      setAddedEmails(emailsData || [])
    } catch (error) {
      console.error('Error fetching added emails:', error)
    } finally {
      setLoadingAddedEmails(false)
    }
  }

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingEmail(true)
    
    const storageType = addEmailForm.storage_destination

    try {
      if (storageType === 'addedemail') {
        const result = await addEmailToAddedEmail(
          addEmailForm.email,
          addEmailForm.first_name,
          addEmailForm.last_name
        )
        
        // Handle the addedemail result
        if (result.success) {
          setMessage({
            text: `Email ${addEmailForm.email} added successfully to AddedEmail table!` +
              (result.error ? ` ${result.error}` : ''),
            type: 'success'
          })
          // Continue with additional processing if needed
        } else {
          setMessage({
            text: result.error || 'Failed to add email to AddedEmail table',
            type: 'error'
          })
        }
      } else if (storageType === 'profile') {
        // Add to profiles table with authentication
        const passwordToUse = addEmailForm.password_option === 'auto'
          ? generatePassword()
          : addEmailForm.custom_password || generatePassword()
        
        const profileResult = await addEmailToProfileTable(
          addEmailForm.email,
          addEmailForm.first_name || '',
          addEmailForm.last_name || '',
          addEmailForm.phone_number || '',
          addEmailForm.school || '',
          addEmailForm.grade || '',
          addEmailForm.date_of_birth || '',
          passwordToUse,
          'Learner' // default role
        )
        
        if (profileResult.success) {
          let successMessage = `✅ Successfully created profile for ${addEmailForm.email} with full authentication! User can now log in.`
          if (passwordToUse) {
            successMessage += ` Generated password: ${passwordToUse}`
          }
          if (profileResult.messages.length > 0) {
            successMessage += ` Additional info: ${profileResult.messages.join(', ')}`
          }
          
          setMessage({
            text: successMessage,
            type: 'success'
          })
          // Reset form
          setAddEmailForm({
            email: '',
            first_name: '',
            last_name: '',
            phone_number: '',
            school: '',
            grade: '',
            date_of_birth: '',
            include_authentication: false,
            password_option: 'auto',
            custom_password: '',
            storage_destination: 'profile'
          })
          await fetchAddedEmails() // In case we want to see created users
          setAddingEmail(false)
          return
        } else {
          const errorMessage = profileResult.errors.length > 0
            ? profileResult.errors.join(', ')
            : 'Unknown error occurred'
          setMessage({
            text: `Failed to create profile: ${errorMessage}`,
            type: 'error'
          })
          setAddingEmail(false)
          return
        }
      } else if (storageType === 'addedemail') {
        // Handle basic addedemail type storage
        const result = await addEmailToAddedEmail(
          addEmailForm.email,
          addEmailForm.first_name,
          addEmailForm.last_name
        )
        
        // Handle the addedemail result
        if (result.success) {
          setMessage({
            text: `Email ${addEmailForm.email} added successfully to AddedEmail table!` +
              (result.error ? ` ${result.error}` : ''),
            type: 'success'
          })
        } else {
          setMessage({
            text: result.error || 'Failed to add email to AddedEmail table',
            type: 'error'
          })
        }
      } else if (storageType === 'both_tables') {
        // Implement "BOTH TABLES" dual write mode
        try {
          const passwordToUse = addEmailForm.password_option === 'auto'
            ? generatePassword()
            : addEmailForm.custom_password || generatePassword()

          // 1st: Create FULL profile with authentication
          const profileResult = await addEmailToProfileTable(
            addEmailForm.email,
            addEmailForm.first_name || '',
            addEmailForm.last_name || '',
            addEmailForm.phone_number || '',
            addEmailForm.school || '',
            addEmailForm.grade || '',
            addEmailForm.date_of_birth || '',
            passwordToUse,
            'Learner'
          )

          if (profileResult.success) {
            // 2nd: Also register as standard contact in AddedEmail
            const addedEmailResult = await addEmailToAddedEmail(
              addEmailForm.email,
              addEmailForm.first_name,
              addEmailForm.last_name,
              addEmailForm.phone_number,
              addEmailForm.school,
              addEmailForm.grade,
              addEmailForm.date_of_birth
            )

            let coreMessage = `🎯 SUPER SUCCESS: Valid fully platform-active user ${addEmailForm.email} enrolled! This person has both:
            • Added to AddedEmail as Linked Resource Contact Entry '${addEmailForm.email}' \
            • Complete authenticated Student Profile existing${passwordToUse ? ` to login now with email / '${passwordToUse}'` : ''}.
            `
            
            if (addedEmailResult.error) {
              coreMessage += `ℹ️ Handled without duplication: Contact Role came from existing record. User position normal operational.`
            }

            setMessage({
              text: coreMessage,
              type: 'success'
            })
            
            // Reset form after successful dual storage creation
             setAddEmailForm({
               email: '',
               first_name: '',
               last_name: '',
               phone_number: '',
               school: '',
               grade: '',
               date_of_birth: '',
               include_authentication: false,
               password_option: 'auto',
               custom_password: '',
               storage_destination: 'both_tables'
             })
             await fetchAddedEmails() // Refresh the AddedEmail view
             if (activeTab === 'profiles') {
               await fetchProfiles() // Also refresh profiles view
             }
             setAddingEmail(false)
             return
          } else {
            setMessage({
              text: `🔄 Storage Options Miss - Profile step failed preventing using both. ${profileResult.errors.join(', ')} Active revert policy: Only built the AddedEmail part with contact tracking. Profiles table method unreliable, will not generate automatic login user account.`,
              type: 'error'
            })
            setAddingEmail(false)
            return
          }

        } catch (dualError) {
          console.error('System control: Both_tables execution error catch/report', dualError)
          setMessage({
            text: `Storage clash avoidance in progress (This prevent connection writes mid-air downflow): ${dualError instanceof Error ? dualError.message : 'Please retrace subsystem check'}`,
            type: 'error'
          })
          setAddingEmail(false)
          return
        }
      }
    } catch (simpleError) {
      console.error('Error in initial addEmailToAddedEmail:', simpleError)
      setMessage({
        text: `Failed to add email to AddedEmail table`,
        type: 'error'
      })
    }

    // Import to test single or dual tables via the enhanced service
    try {
      const advancedResult = await addEmailWithAuthentication(
        addEmailForm.email,
        addEmailForm.first_name,
        addEmailForm.last_name,
        addEmailForm.phone_number || undefined, // phone_number (optional)
        addEmailForm.school || undefined, // school (optional)
        addEmailForm.grade || undefined, // grade (optional)
        addEmailForm.date_of_birth || undefined, // date_of_birth (optional)
        addEmailForm.include_authentication,
        addEmailForm.password_option === 'custom' ? addEmailForm.custom_password : undefined
      )

      let finalMessage = ''
      const messageChunks = [`Added Email ${addEmailForm.email} to AddedEmail`]

      if (advancedResult.authData && advancedResult.authData.auth_created) {
        messageChunks.push(`✅ Created Users/authentication entry${advancedResult.authData.passwordDisplay ? `. Login: ${addEmailForm.email} / ${advancedResult.authData.passwordDisplay}` : ''}`)
      }

      if (advancedResult.messages) {
        messageChunks.push(...advancedResult.messages)
      }

      finalMessage = messageChunks.join(' ')

      if (advancedResult.success) {
        setMessage({ text: finalMessage, type: 'success' })
        // Reset the immediate form UI
        setAddEmailForm({
          email: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          school: '',
          grade: '',
          date_of_birth: '',
          include_authentication: false,
          password_option: 'auto',
          custom_password: '',
          storage_destination: 'addedemail'
        })
        setGeneratedAddEmailPassword('')
        
        // Refresh the added emails list to update visual status
        await fetchAddedEmails()
      
      } else if (advancedResult.errors) {
        // Still consider request successful if email was added despite auth errors
        if (messageChunks.includes('Added Email') && advancedResult.errors.some(e => e.includes('Auth profile'))) {
          setMessage({ text: finalMessage, type: 'success' })
          setAddEmailForm({
            email: '',
            first_name: '',
            last_name: '',
            phone_number: '',
            school: '',
            grade: '',
            date_of_birth: '',
            include_authentication: false,
            password_option: 'auto',
            custom_password: '',
            storage_destination: 'addedemail'
          })
          await fetchAddedEmails()
        } else {
          setMessage({
            text: `Email partially added but encountered issues - confirmed entry in AddedEmail table - please check database sync. ${advancedResult.errors.join(', ')}`,
            type: 'error'
          })
        }
      }
    } catch (advancedError) {
      const errorDetails = advancedError instanceof Error ? advancedError.message : 'Connection or system error'
      // Attempt debounced re-opening by not permanently blocking submission
      console.warn('Fallback to simpler Add logic:', errorDetails)
      setMessage({ text: `Oops unable to Dual-write. ${errorDetails}. Will only add to AddedEmail instead.`, type: 'error' })
      
      // Falling back
      const regularResult = await addEmailToAddedEmail(
        addEmailForm.email,
        addEmailForm.first_name,
        addEmailForm.last_name
      )
      
      if (regularResult.success || regularResult.error?.includes('already exists')) {
        setMessage({
          text: `Fallback completed - Email (${addEmailForm.email}) added to AddedEmail table (Auth generation skipped)`,
          type: 'error'  // Changed from 'warning'
        })
        setAddEmailForm({
          email: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          school: '',
          grade: '',
          date_of_birth: '',
          include_authentication: false,
          password_option: 'auto',
          custom_password: '',
          storage_destination: 'addedemail' as 'addedemail' | 'profile'
        })
        await fetchAddedEmails()
      } else {
        setMessage({ text: `Full failure to add email: ${regularResult.error || 'Please try later'}`, type: 'error' })
      }
    } finally {
      setAddingEmail(false)
    }

  }

  const handleCancelEdit = () => {
    setEditingProfile(null)
    setEditProfileData({})
  }

  // Authentication functions for AddedEmail
  const authenticateEmail = async (emailEntry: AddedEmail) => {
    setAuthenticatingEmail(emailEntry.email)
    try {
      const result = await createAuthUserFromAddedEmail(emailEntry)
      
      if (result.success) {
        setMessage({
          text: `Successfully authenticated ${emailEntry.email}! Authentication account created.`,
          type: 'success'
        })
        // Update auth status for this email
        setAuthStatusMap(prev => ({
          ...prev,
          [emailEntry.email]: true
        }))
      } else {
        setMessage({
          text: `Failed to authenticate ${emailEntry.email}: ${result.error}`,
          type: 'error'
        })
      }
    } catch (error: any) {
      setMessage({
        text: `Error authenticating ${emailEntry.email}: ${error.message || 'Unknown error'}`,
        type: 'error'
      })
    } finally {
      setAuthenticatingEmail(null)
    }
  }

  const bulkAuthenticateEmails = async () => {
    // Get emails that don't have auth accounts yet
    const emailsToAuthenticate = addedEmails.filter(emailEntry => !authStatusMap[emailEntry.email])
    
    if (emailsToAuthenticate.length === 0) {
      setMessage({
        text: 'All emails are already authenticated!',
        type: 'error'
      })
      return
    }

    setBulkAuthenticating(true)
    setMessage(null)

    try {
      const result = await bulkCreateAuthUsers(emailsToAuthenticate)
      
      if (result.success || result.created.length > 0) {
        setMessage({
          text: `Successfully authenticated ${result.created.length} emails${result.errors.length > 0 ? ` (${result.errors.length} failed)` : ''}`,
          type: 'success'
        })
        
        // Update auth status for created users
        const updatedStatusMap = { ...authStatusMap }
        result.created.forEach(email => {
          updatedStatusMap[email] = true
        })
        setAuthStatusMap(updatedStatusMap)
      } else {
        setMessage({
          text: `Failed to authenticate emails: ${result.errors.map(e => e.error).join(', ')}`,
          type: 'error'
        })
      }
    } catch (error: any) {
      setMessage({
        text: `Error during bulk authentication: ${error.message || 'Unknown error'}`,
        type: 'error'
      })
    } finally {
      setBulkAuthenticating(false)
    }
  }

  // Delete functionality for AddedEmail entries
  const handleDeleteEmail = async (id: number) => {
    setDeletingEmailId(id)
    try {
      const success = await deleteEmailFromAddedEmail(id)
      if (success) {
        setMessage({
          text: 'Email deleted successfully!',
          type: 'success'
        })
        // Remove from local state
        setAddedEmails(prev => prev.filter(email => email.id !== id))
        // Remove auth status if it exists
        const emailToDelete = addedEmails.find(email => email.id === id)
        if (emailToDelete) {
          setAuthStatusMap(prev => {
            const newStatus = { ...prev }
            delete newStatus[emailToDelete.email]
            return newStatus
          })
        }
        setShowDeleteConfirm(null)
      } else {
        setMessage({
          text: 'Failed to delete email',
          type: 'error'
        })
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to delete email',
        type: 'error'
      })
    } finally {
      setDeletingEmailId(null)
    }
  }

  // Email duplication prevention
  const validateEmailExists = async (email: string) => {
    if (email && isValidEmail(email)) {
      setCheckingEmail(true)
      const emailInAddedEmails = addedEmails.some(entry => entry.email.toLowerCase() === email.toLowerCase().trim())
      if (emailInAddedEmails) {
        setEmailExistsError('This email already exists in AddedEmail table')
      } else {
        try {
          const exists = await checkEmailExistsInAddedEmail(email)
          if (exists) {
            setEmailExistsError('This email already exists in AddedEmail table')
          } else {
            setEmailExistsError(null)
          }
        } catch (error) {
          console.error('Error checking email existence:', error)
        }
      }
      setCheckingEmail(false)
    } else {
      setEmailExistsError(null)
    }
  }

  const handleAddEmailChange = (field: keyof typeof addEmailForm, value: string) => {
    if (field === 'email') {
      // Apply email trimming immediately
      const trimmedValue = value.trim()
      
      setAddEmailForm(prev => ({ ...prev, email: trimmedValue }))
      
      // Clear existing timeout
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }
      
      // Set debounced validation
      const timeout = setTimeout(() => {
        validateEmailExists(trimmedValue)
      }, 500)
      setEmailCheckTimeout(timeout)
    } else {
      setAddEmailForm(prev => ({ ...prev, [field]: value }))
    }
  }

  // Refresh auth status for current email list
  const refreshAuthStatus = async () => {
    try {
      const emailList = addedEmails.map(email => email.email)
      const status = await getAuthUserStatus(emailList)
      setAuthStatusMap(status)
    } catch (error) {
      console.error('Error refreshing auth status:', error)
    }
  }

  // Handle CSV File Upload
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvImportFile(file)
      setImportResults(null)
    } else {
      setMessage({
        text: 'Please select a valid CSV file',
        type: 'error'
      })
    }
  }

  // Import Emails from CSV
  const handleCSVImport = async () => {
    if (!csvImportFile) {
      setMessage({
        text: 'Please select a CSV file to import',
        type: 'error'
      })
      return
    }

    setImportingCSV(true)
    setImportResults(null)
    
    try {
      const result = await importEmailsFromCSV(csvImportFile)
      setImportResults(result)
      
      if (result.processed > 0 || result.errors.length === 0) {
        setMessage({
          text: `Successfully imported ${result.processed} emails${result.duplicates > 0 ? ` (${result.duplicates} duplicates skipped)` : ''}`,
          type: 'success'
        })
        setCsvImportFile(null)
        
        // Refresh the added emails list
        await fetchAddedEmails()
      } else {
        setMessage({
          text: `Import completed with ${result.errors.length} errors`,
          type: 'error'
        })
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to import CSV',
        type: 'error'
      })
    } finally {
      setImportingCSV(false)
    }
  }

  // Download CSV Template
  const handleDownloadTemplate = () => {
    downloadCSVTemplate()
    setMessage({
      text: 'CSV template downloaded successfully',
      type: 'success'
    })
  }

  const getUnauthenticatedEmailCount = (): number => {
    if (!addedEmails.length) return 0
    return addedEmails.filter(emailEntry => authStatusMap[emailEntry.email] !== true).length
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Create and manage user accounts and profiles</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{recentUsers.length} recent users</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Create User</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profiles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Manage Profiles</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('addedEmails')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'addedEmails'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Added Emails</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New User</h2>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    placeholder="user@example.com"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    value={userFormData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    onBlur={() => handleFieldBlur('first_name')}
                    placeholder="John"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      firstNameError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {firstNameError && (
                    <p className="mt-1 text-sm text-red-600">{firstNameError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    value={userFormData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    onBlur={() => handleFieldBlur('last_name')}
                    placeholder="Doe"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      lastNameError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {lastNameError && (
                    <p className="mt-1 text-sm text-red-600">{lastNameError}</p>
                  )}
                </div>
              </div>

              {/* Phone and Role Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    value={userFormData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={userFormData.role}
                    onChange={(e) => handleInputChange('role', e.target.value as 'Learner' | 'Parent' | 'Tutor' | 'Other')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Learner">Learner</option>
                    <option value="Parent">Parent</option>
                    <option value="Tutor">Tutor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Password Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Password Options
                </label>
                
                {/* Auto-generate option */}
                <div className="mb-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="passwordOption"
                      value="auto"
                      checked={passwordOption === 'auto'}
                      onChange={() => {
                        setPasswordOption('auto')
                        if (!generatedPassword) {
                          handleGeneratePassword()
                        }
                      }}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-gray-900 font-medium">Auto-generate password</span>
                      <p className="text-gray-600 text-sm mt-1">Create a secure random password</p>
                      
                      {passwordOption === 'auto' && generatedPassword && (
                        <div className="mt-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 bg-gray-50 border border-gray-300 rounded px-3 py-2 font-mono text-sm">
                              {generatedPassword}
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyPassword}
                              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                            >
                              <Copy className="w-4 h-4" />
                              <span>{copiedPassword ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleGeneratePassword}
                              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                            >
                              <RefreshCw className="w-4 h-4" />
                              <span>Regenerate</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                
                {/* Custom password option */}
                <div className="mb-0">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="passwordOption"
                      value="custom"
                      checked={passwordOption === 'custom'}
                      onChange={() => setPasswordOption('custom')}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-gray-900 font-medium">Custom password</span>
                      <p className="text-gray-600 text-sm mt-1">Set your own password</p>
                      
                      {passwordOption === 'custom' && (
                        <div className="mt-3">
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                              type="password"
                              value={customPassword}
                              onChange={(e) => setCustomPassword(e.target.value)}
                              onBlur={() => handleFieldBlur('customPassword')}
                              placeholder="Enter password"
                              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                customPasswordError ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {customPasswordError && (
                            <p className="mt-1 text-sm text-red-600">{customPasswordError}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Minimum 6 characters
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Creating User...</span>
                    </>
                  ) : (
                    <span>Add User</span>
                  )}
                </button>
                {submitted && !canSubmit && (
                  <p className="mt-2 text-sm text-red-600 text-center">
                    Please fix the form errors before submitting
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Recent Users Sidebar */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recently Created Users</h2>
            
            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No users created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900 truncate">{user.email}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'profiles' ? (
        /* Profile Management Tab */
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Management</h2>
          
          {loadingProfiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading profiles...</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No profiles found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => (
                <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
                  {editingProfile === profile.id ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Edit Profile</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveProfile(profile.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={editProfileData.email || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={editProfileData.role || profile.role}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, role: e.target.value as 'Learner' | 'Parent' | 'Tutor' | 'Other' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Learner">Learner</option>
                            <option value="Parent">Parent</option>
                            <option value="Tutor">Tutor</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            value={editProfileData.first_name || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={editProfileData.last_name || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={editProfileData.phone_number || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                          <input
                            type="text"
                            value={editProfileData.school || ''}
                            onChange={(e) => setEditProfileData(prev => ({ ...prev, school: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {profile.first_name?.[0] || profile.email?.[0] || 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {profile.first_name && profile.last_name 
                                ? `${profile.first_name} ${profile.last_name}`
                                : profile.email || 'No name'}
                            </h3>
                            <p className="text-sm text-gray-600">{profile.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditProfile(profile.id)}
                          className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Role:</span>
                          <span className="ml-1 text-gray-600">{profile.role}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Phone:</span>
                          <span className="ml-1 text-gray-600">{profile.phone_number || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">School:</span>
                          <span className="ml-1 text-gray-600">{profile.school || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Created:</span>
                          <span className="ml-1 text-gray-600">
                            {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Added Emails Tab */
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Added Emails Management</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-600">
                <ShieldCheck className="w-5 h-5" />
                <span>
                  {Object.values(authStatusMap).filter(status => status).length} / {addedEmails.length} authenticated
                </span>
              </div>
              {getUnauthenticatedEmailCount() > 0 && (
                <button
                  onClick={bulkAuthenticateEmails}
                  disabled={bulkAuthenticating}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {bulkAuthenticating ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>
                    {bulkAuthenticating ? 'Authenticating...' : `Authenticate (${getUnauthenticatedEmailCount()})`}
                  </span>
                </button>
              )}
              <button
                onClick={refreshAuthStatus}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Refresh authentication status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success'
                ?'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Add Email Form */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Email</h3>
            <form onSubmit={handleAddEmail} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="add_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="add_email"
                      type="email"
                      value={addEmailForm.email}
                      onChange={(e) => handleAddEmailChange('email', e.target.value)}
                      placeholder="user@example.com"
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        emailExistsError ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                      } ${checkingEmail ? 'pr-10' : ''}`}
                    />
                    {checkingEmail && (
                      <div className="absolute right-3 inset-y-0 flex items-center">
                        <Loader className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  {emailExistsError && (
                    <p className="mt-1 text-sm text-orange-600">{emailExistsError}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="add_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    id="add_first_name"
                    type="text"
                    value={addEmailForm.first_name}
                    onChange={(e) => handleAddEmailChange('first_name', e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="add_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="add_last_name"
                    type="text"
                    value={addEmailForm.last_name}
                    onChange={(e) => handleAddEmailChange('last_name', e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="add_phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="add_phone_number"
                    type="tel"
                    value={addEmailForm.phone_number}
                    onChange={(e) => handleAddEmailChange('phone_number', e.target.value)}
                    placeholder="+27621234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
             {/* Storage Destination Selection */}
             <div className="border-t border-gray-200 pt-4">
               <label className="block text-sm font-medium text-gray-700 mb-3">
                 Storage Destination <span className="text-blue-500">*</span>
               </label>
               <div className="grid grid-cols-3 gap-4">
                 <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none hover:border-blue-500">
                   <input
                     type="radio"
                     value="addedemail"
                     checked={addEmailForm.storage_destination === 'addedemail'}
                     onChange={(e) => setAddEmailForm(prev => ({ ...prev, storage_destination: e.target.value as 'addedemail' | 'profile' }))}
                     className="sr-only"
                   />
                   <div className="flex w-full items-center justify-between">
                     <div className="flex items-center">
                       <div className={`text-sm font-medium ${
                         addEmailForm.storage_destination === 'addedemail' ? 'text-blue-900' : 'text-gray-900'
                       }`}>
                         <p>AddedEmail Table</p>
                         <p className="text-xs text-gray-500 mt-1">Email tracking only (basic storage)</p>
                       </div>
                     </div>
                     <div className={`h-5 w-5 shrink-0 rounded-full border ${
                       addEmailForm.storage_destination === 'addedemail' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                     } flex items-center justify-center`}>
                       {addEmailForm.storage_destination === 'addedemail' && (
                         <div className="h-2 w-2 rounded-full bg-white"></div>
                       )}
                     </div>
                   </div>
                 </label>
 
                 <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none hover:border-green-500">
                   <input
                     type="radio"
                     value="profile"
                     checked={addEmailForm.storage_destination === 'profile'}
                     onChange={(e) => setAddEmailForm(prev => ({ ...prev, storage_destination: e.target.value as 'addedemail' | 'profile' }))}
                     className="sr-only"
                   />
                   <div className="flex w-full items-center justify-between">
                     <div className="flex items-center">
                       <div className={`text-sm font-medium ${
                         addEmailForm.storage_destination === 'profile' ? 'text-green-900' : 'text-gray-900'
                       }`}>
                         <p>Profile Table</p>
                         <p className="text-xs text-gray-500 mt-1">Full user with authentication</p>
                       </div>
                     </div>
                     <div className={`h-5 w-5 shrink-0 rounded-full border ${
                       addEmailForm.storage_destination === 'profile' ? 'border-green-600 bg-green-600' : 'border-gray-300'
                     } flex items-center justify-center`}>
                       {addEmailForm.storage_destination === 'profile' && (
                         <div className="h-2 w-2 rounded-full bg-white"></div>
                       )}
                     </div>
                   </div>

<label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 focus:outline-none hover:border-purple-500">
  <input
    type="radio"
    value="both_tables"
    checked={addEmailForm.storage_destination === 'both_tables'}
    onChange={(e) => setAddEmailForm(prev => ({ ...prev, storage_destination: e.target.value as 'addedemail' | 'profile' | 'both_tables' }))}
    className="sr-only"
  />
  <div className="flex w-full items-center justify-between">
    <div className="flex items-center">
      <div className={`text-sm font-medium ${
        addEmailForm.storage_destination === 'both_tables' ? 'text-purple-900' : 'text-gray-900'
      }`}>
        <p>Both Tables</p>
        <p className="text-xs text-gray-500 mt-1">Contact tracking + active user</p>
      </div>
    </div>
    <div className={`h-5 w-5 shrink-0 rounded-full border ${
      addEmailForm.storage_destination === 'both_tables' ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
    } flex items-center justify-center`}>
      {addEmailForm.storage_destination === 'both_tables' && (
        <div className="h-2 w-2 rounded-full bg-white"></div>
      )}
    </div>
  </div>
</label>
                 </label>
               </div>
               <p className="text-xs text-gray-500 mt-2">
                 {addEmailForm.storage_destination === 'addedemail'
                   ? 'Email will be stored in AddedEmail tracking table only (no authentication)'
                   : addEmailForm.storage_destination === 'both_tables'
                   ? 'Full user will be created with platform access and also stored in AddedEmail for contact tracking'
                   : 'User will be created with full profile and immediate login capability'
                 }
               </p>
             </div>
 
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="add_school" className="block text-sm font-medium text-gray-700 mb-2">
                    School
                  </label>
                  <input
                    id="add_school"
                    type="text"
                    value={addEmailForm.school}
                    onChange={(e) => handleAddEmailChange('school', e.target.value)}
                    placeholder="Sandton Secondary School"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="add_grade" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    id="add_grade"
                    type="text"
                    value={addEmailForm.grade}
                    onChange={(e) => handleAddEmailChange('grade', e.target.value)}
                    placeholder="Grade 11"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="add_date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    id="add_date_of_birth"
                    type="date"
                    value={addEmailForm.date_of_birth}
                    onChange={(e) => handleAddEmailChange('date_of_birth', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={addingEmail || !addEmailForm.email || emailExistsError !== null || checkingEmail}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {addingEmail ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Email</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          {/* CSV Import Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import via CSV</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Import multiple emails at once using a CSV file. The CSV should have email, first_name,
                  and last_name columns.
                </p>
                
                <div className="flex items-center space-x-3">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVFileChange}
                      className="hidden"
                      id="csv-file"
                    />
                    <div className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 cursor-pointer">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-600">
                        {csvImportFile ? csvImportFile.name : 'Choose CSV file'}
                      </span>
                    </div>
                  </label>
                  <button
                    onClick={handleCSVImport}
                    disabled={!csvImportFile || importingCSV}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {importingCSV ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{importingCSV ? 'Importing...' : 'Import CSV'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Get Template</span>
                  </button>
                </div>
              </div>
              
              {/* Import Results */}
              {importResults && (
                <div className={`p-4 rounded-lg border ${
                  importResults.errors.length === 0
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}>
                  <p className="font-medium mb-2">
                    Import Results:
                  </p>
                  <div className="text-sm space-y-1">
                    <p>✅ Processed: {importResults.processed} emails</p>
                    {importResults.duplicates > 0 && (
                      <p>⚠️  Duplicates skipped: {importResults.duplicates} emails</p>
                    )}
                    {importResults.errors.length > 0 && (
                      <p>❌ Failed: {importResults.errors.length} rows</p>
                    )}
                  </div>
                  
                  {importResults.errors.length > 0 && (
                    <div className="mt-3 text-sm">
                      <p className="font-medium mb-1">Errors:</p>
                      <ul className="max-h-32 overflow-y-auto space-y-1">
                        {importResults.errors.map((errorData, index) => (
                          <li key={index} className="text-red-600">
                            Row {errorData.row}: {errorData.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Added Emails List */}
          {loadingAddedEmails ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading emails...</span>
            </div>
          ) : addedEmails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No emails added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addedEmails.map((emailEntry) => (
                <div key={emailEntry.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 ${authStatusMap[emailEntry.email] ? 'bg-green-100' : 'bg-orange-100'} rounded-full flex items-center justify-center`}>
                        {authStatusMap[emailEntry.email] ? (
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <Mail className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {emailEntry.first_name && emailEntry.last_name
                            ? `${emailEntry.first_name} ${emailEntry.last_name}`
                            : emailEntry.email}
                        </h3>
                        <p className="text-sm text-gray-600">{emailEntry.email}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          {emailEntry.phone_number && (
                            <span>📞 {emailEntry.phone_number}</span>
                          )}
                          {emailEntry.school && (
                            <span>🏫 {emailEntry.school}</span>
                          )}
                          {emailEntry.grade && (
                            <span>🎓 Grade {emailEntry.grade}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        Added {emailEntry.created_at ? new Date(emailEntry.created_at).toLocaleDateString() : 'Unknown'}
                        {authStatusMap[emailEntry.email] && (
                          <div className="text-green-600 text-xs font-medium mt-1">✓ Authenticated</div>
                        )}
                      </div>
                      {!authStatusMap[emailEntry.email] && (
                        <button
                          onClick={() => authenticateEmail(emailEntry)}
                          disabled={authenticatingEmail === emailEntry.email}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed space-x-1"
                        >
                          {authenticatingEmail === emailEntry.email ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          <span className="text-xs">Authenticate</span>
                        </button>
                      )}
                      {/** Delete functionality */}
                      <button
                        onClick={() => setShowDeleteConfirm(emailEntry.id === showDeleteConfirm ? null : emailEntry.id)}
                        disabled={deletingEmailId === emailEntry.id}
                        className="flex items-center space-x- background-transparent border border-red-300 p-1 rounded hover:bg-red-50 disabled:bg-gray-100"
                        title="Delete email"
                      >
                        {deletingEmailId === emailEntry.id ? (
                          <Loader className="w-3 h-3 animate-spin text-gray-400" />
                        ) : (
                          <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  {showDeleteConfirm === emailEntry.id && (
                    <div className="mt-3 flex items-center justify-end space-x-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <span className="text-sm text-red-800">Permanently delete this email?</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteEmail(emailEntry.id)}
                          disabled={deletingEmailId === emailEntry.id}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                        >
                          {deletingEmailId === emailEntry.id ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          disabled={deletingEmailId === emailEntry.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}