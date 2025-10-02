/**
 * Data consistency and precision validation utilities
 */

// import { validate as uuidValidate } from 'uuid' // Removing external dependency for simplicity
// Simple UUID validation (basic format check)
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Interface for validated and formatted student marks data
 * This ensures data types match the database schema precisely
 */
export interface ValidatedStudentMark {
  user_id: string  // uuid as string
  math_mark: number | null  // integer can be stored as number, potentially decimal values
  home_language_mark: number | null  // integer can be stored as number, potentially decimal values 
  first_additional_language_mark: number | null  // integer can be stored as number, potentially decimal values
  second_additional_language_mark: number | null  // integer can be stored as number, potentially decimal values
  subject1: string | null  // text kept as string
  subject1_mark: number | null  // integer can be stored as number, potentially decimal values
  subject2: string | null  // text kept as string
  subject2_mark: number | null  // integer can be stored as number, potentially decimal values
  subject3: string | null  // text kept as string
  subject3_mark: number | null  // integer can be stored as number, potentially decimal values
  subject4: string | null  // text kept as string
  subject4_mark: number | null  // integer can be stored as number, potentially decimal values
  life_orientation_mark: number | null  // integer can be stored as number, potentially decimal values
  average: number | null  // integer can be stored as number, potentially decimal values
  math_level: number | null  // smallint requires integer validation (0-7 typically)
  home_language_level: number | null  // smallint requires integer validation (0-7 typically)
  first_additional_language_level: number | null  // smallint requires integer validation (0-7 typically)
  second_additional_language_level: number | null  // smallint requires integer validation (0-7 typically)
  subject1_level: number | null  // smallint requires integer validation (0-7 typically)
  subject2_level: number | null  // smallint requires integer validation (0-7 typically)
  subject3_level: number | null  // smallint requires integer validation (0-7 typically)
  subject4_level: number | null  // smallint requires integer validation (0-7 typically)
  aps_mark: number | null  // integer requires validation (0-42 typically)
  life_orientation_level: number | null  // smallint requires integer validation (0-7 typically)
  math_type: string | null  // text kept as string
  home_language: string | null  // text kept as string
  first_additional_language: string | null  // text kept as string
  second_additional_language: string | null  // text kept as string
  profile_id: string | null  // uuid as string
}

/**
 * Validation results with detailed error information
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  formattedData: ValidatedStudentMark | null
}

/**
 * Constraints and limits for each field type
 */
export const FIELD_CONSTRAINTS = {
  MIN_MARK: 0,
  MAX_MARK: 100,
  MIN_LEVEL: 0,
  MAX_LEVEL: 7,
  MIN_APS: 0,
  MAX_APS: 42,
  MAX_TEXT_LENGTH: 255,
  UUID_LENGTH: 36,
} as const

/**
 * Validates a numeric mark value
 */
export function validateMark(
  value: any, 
  fieldName: string
): { success: boolean; value: number | null; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { success: true, value: null }
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value)
  
  if (isNaN(numValue)) {
    return { 
      success: false, 
      value: null, 
      error: `${fieldName}: Invalid number format "${value}"` 
    }
  }
  
  if (numValue < FIELD_CONSTRAINTS.MIN_MARK || numValue > FIELD_CONSTRAINTS.MAX_MARK) {
    return { 
      success: false, 
      value: null, 
      error: `${fieldName}: Value ${numValue} must be between ${FIELD_CONSTRAINTS.MIN_MARK} and ${FIELD_CONSTRAINTS.MAX_MARK}` 
    }
  }
  
  return { success: true, value: Math.round(numValue * 100) / 100 } // Preserve up to 2 decimal places
}

/**
 * Validates a smallint level value (0-7 typically, but flexible)
 */
export function validateLevel(
  value: any, 
  fieldName: string,
  maxValue: number = FIELD_CONSTRAINTS.MAX_LEVEL
): { success: boolean; value: number | null; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { success: true, value: null }
  }
  
  const numValue = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  
  if (isNaN(numValue)) {
    return { 
      success: false, 
      value: null, 
      error: `${fieldName}: Invalid integer format "${value}"` 
    }
  }
  
  if (!Number.isInteger(numValue)) {
    return { 
      success: false, 
      value: null, 
      error: `${fieldName}: Level ${numValue} must be an integer` 
    }
  }
  
  if (numValue < FIELD_CONSTRAINTS.MIN_LEVEL || numValue > maxValue) {
    return { 
      success: false, 
      value: null, 
      error: `${fieldName}: Level ${numValue} must be between ${FIELD_CONSTRAINTS.MIN_LEVEL} and ${maxValue}` 
    }
  }
  
  return { success: true, value: numValue }
}

/**
 * Validates APS mark (0-42)
 */
export function validateApsMark(
  value: any, 
  fieldName: string
): { success: boolean; value: number | null; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { success: true, value: null }
  }
  
  const numValue = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  
  if (isNaN(numValue)) {
    return { 
      success: false, 
      value: null, 
      error: `${fieldName}: Invalid APS format "${value}"` 
    }
  }
  
  if (!Number.isInteger(numValue)) {
    return { 
      success: false, 
      value: null, 
      error: `${fieldName}: APS ${numValue} must be an integer` 
    }
  }
  
  if (numValue < FIELD_CONSTRAINTS.MIN_APS || numValue > FIELD_CONSTRAINTS.MAX_APS) {
    return { 
      success: false, 
      value: null, 
      error: `${fieldName}: APS ${numValue} must be between ${FIELD_CONSTRAINTS.MIN_APS} and ${FIELD_CONSTRAINTS.MAX_APS}` 
    }
  }
  
  return { success: true, value: numValue }
}

/**
 * Validates UUID string format
 */
export function validateUUID(
  value: any, 
  fieldName: string
): { success: boolean; value: string | null; error?: string } {
  if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
    return { success: true, value: null }
  }
  
  const stringValue = String(value)
  
  // Basic UUID format validation (simplified pattern matching)
  if (stringValue.length !== FIELD_CONSTRAINTS.UUID_LENGTH || !uuidPattern.test(stringValue)) {
    return { 
      success: false, 
      value: null, 
      error: `${fieldName}: Invalid UUID format "${stringValue}"` 
    }
  }
  
  return { success: true, value: stringValue }
}

/**
 * Validates and trims text fields
 */
export function validateText(
  value: any, 
  fieldName: string
): { success: boolean; value: string | null; warning?: string } {
  if (value === null || value === undefined || value === '') {
    return { success: true, value: null }
  }
  
  const stringValue = String(value).trim()
  
  if (stringValue.length > FIELD_CONSTRAINTS.MAX_TEXT_LENGTH) {
    return { 
      success: true, 
      value: stringValue.substring(0, FIELD_CONSTRAINTS.MAX_TEXT_LENGTH),
      warning: `${fieldName}: Text truncated to ${FIELD_CONSTRAINTS.MAX_TEXT_LENGTH} characters`
    }
  }
  
  return { success: true, value: stringValue }
}

/**
 * Comprehensive student data validation and formatting
 */
export function validateAndFormatStudentData(studentData: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const formattedData: Partial<ValidatedStudentMark> = {}
  
  // Validate and format each field
  const fieldsData = [
    { key: 'user_id', validator: validateUUID, params: [studentData.user_id, 'user_id'] },
    { key: 'math_mark', validator: validateMark, params: [studentData.math_mark, 'math_mark'] },
    { key: 'home_language_mark', validator: validateMark, params: [studentData.home_language_mark, 'home_language_mark'] },
    { key: 'first_additional_language_mark', validator: validateMark, params: [studentData.first_additional_language_mark, 'first_additional_language_mark'] },
    { key: 'second_additional_language_mark', validator: validateMark, params: [studentData.second_additional_language_mark, 'second_additional_language_mark'] },
    { key: 'subject1', validator: validateText, params: [studentData.subject1, 'subject1'] },
    { key: 'subject1_mark', validator: validateMark, params: [studentData.subject1_mark, 'subject1_mark'] },
    { key: 'subject2', validator: validateText, params: [studentData.subject2, 'subject2'] },
    { key: 'subject2_mark', validator: validateMark, params: [studentData.subject2_mark, 'subject2_mark'] },
    { key: 'subject3', validator: validateText, params: [studentData.subject3, 'subject3'] },
    { key: 'subject3_mark', validator: validateMark, params: [studentData.subject3_mark, 'subject3_mark'] },
    { key: 'subject4', validator: validateText, params: [studentData.subject4, 'subject4'] },
    { key: 'subject4_mark', validator: validateMark, params: [studentData.subject4_mark, 'subject4_mark'] },
    { key: 'life_orientation_mark', validator: validateMark, params: [studentData.life_orientation_mark, 'life_orientation_mark'] },
    { key: 'average', validator: validateMark, params: [studentData.average, 'average'] },
    { key: 'math_level', validator: validateLevel, params: [studentData.math_level, 'math_level', 7] },
    { key: 'home_language_level', validator: validateLevel, params: [studentData.home_language_level, 'home_language_level', 7] },
    { key: 'first_additional_language_level', validator: validateLevel, params: [studentData.first_additional_language_level, 'first_additional_language_level', 7] },
    { key: 'second_additional_language_level', validator: validateLevel, params: [studentData.second_additional_language_level, 'second_additional_language_level', 7] },
    { key: 'subject1_level', validator: validateLevel, params: [studentData.subject1_level, 'subject1_level', 7] },
    { key: 'subject2_level', validator: validateLevel, params: [studentData.subject2_level, 'subject2_level', 7] },
    { key: 'subject3_level', validator: validateLevel, params: [studentData.subject3_level, 'subject3_level', 7] },
    { key: 'subject4_level', validator: validateLevel, params: [studentData.subject4_level, 'subject4_level', 7] },
    { key: 'aps_mark', validator: validateApsMark, params: [studentData.aps_mark, 'aps_mark'] },
    { key: 'life_orientation_level', validator: validateLevel, params: [studentData.life_orientation_level, 'life_orientation_level', 7] },
    { key: 'math_type', validator: validateText, params: [studentData.math_type, 'math_type'] },
    { key: 'home_language', validator: validateText, params: [studentData.home_language, 'home_language'] },
    { key: 'first_additional_language', validator: validateText, params: [studentData.first_additional_language, 'first_additional_language'] },
    { key: 'second_additional_language', validator: validateText, params: [studentData.second_additional_language, 'second_additional_language'] },
    { key: 'profile_id', validator: validateUUID, params: [studentData.profile_id, 'profile_id'] }
  ] as const
  
  fieldsData.forEach(({ key, validator, params }) => {
    const result = validator(...params)
    
    if (!result.success) {
      errors.push(result.error || 'Unknown validation error')
    } else {
      if (result.warning) {
        warnings.push(result.warning)
      }
      (formattedData as any)[key] = result.value
    }
  })
  
  const finalData = formattedData as ValidatedStudentMark
  
  // Check for invalid average calculations
  if (finalData.average !== null && (finalData.average < 0 || finalData.average > 100)) {
    errors.push(`Average ${finalData.average} is outside valid range (0-100)`)
  }
  
  // Check APS mark consistency with subject levels (more complex validation could go here)
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    formattedData: errors.length === 0 ? finalData : null
  }
}

/**
 * Bulk validation for student data arrays
 */
export function validateStudentDataArray(students: any[]): {
  validStudents: ValidatedStudentMark[]
  invalidStudents: { data: any; errors: string[]; index: number }[]
  validationSummary: {
    total: number
    valid: number
    invalid: number
    warnings: number
  }
} {
  const validStudents: ValidatedStudentMark[] = []
  const invalidStudents: { data: any; errors: string[]; index: number }[] = []
  let totalWarnings = 0
  
  students.forEach((student, index) => {
    const result = validateAndFormatStudentData(student)
    
    if (result.isValid && result.formattedData) {
      validStudents.push(result.formattedData)
      totalWarnings += result.warnings.length
    } else {
      invalidStudents.push({
        data: student,
        errors: result.errors,
        index
      })
      totalWarnings += result.warnings.length
    }
  })
  
  return {
    validStudents,
    invalidStudents,
    validationSummary: {
      total: students.length,
      valid: validStudents.length,
      invalid: invalidStudents.length,
      warnings: totalWarnings
    }
  }
}

/**
 * Format a value for display with proper precision
 */
export function formatNumericDisplay(
  value: number | null, 
  precision: number = 1,
  suffix: string = '%'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A'
  }
  
  const multiplier = Math.pow(10, precision)
  const roundedValue = Math.round(value * multiplier) / multiplier
  
  return `${roundedValue}${suffix}`
}

/**
 * Parse string to number with safety
 */
export function safeNumberParse(
  value: string | number | null | undefined, 
  defaultValue: number = 0
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }
  
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : defaultValue
  }
  
  const parsed = parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : defaultValue
}