import { z } from 'zod'

type formData = {
  name: string
  email: string
  university: string
  password: string
}

type FormField = keyof formData

type FieldErrors = Partial<Record<FormField, string[]>>

type ValidationResult = {
  isValid: boolean
  errors: string[]
  fieldErrors: FieldErrors
}

const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[@$!%*?&]/, 'Password must contain at least one special character')

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(3, 'Name must be at least 3 characters long')
    .regex(/^[a-zA-Z ]+$/, 'Name must contain only letters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  university: z
    .string()
    .trim()
    .min(1, 'University is required')
    .min(3, 'University must be at least 3 characters long'),
  password: z.string(),
})

export const validatePassword = (password: string): ValidationResult => {
  const result = passwordSchema.safeParse(password)

  if (result.success) {
    return { isValid: true, errors: [], fieldErrors: {} }
  }

  const passwordErrors = result.error.issues.map((issue) => issue.message)

  return {
    isValid: false,
    errors: passwordErrors,
    fieldErrors: {
      password: [...new Set(passwordErrors)],
    },
  }
}


export const validateForm = (formData: formData): ValidationResult => {
  const formResult = formSchema.safeParse(formData)
  const newErrors: string[] = []
  const fieldErrors: FieldErrors = {}

  if (!formResult.success) {
    for (const issue of formResult.error.issues) {
      const field = issue.path[0] as FormField | undefined

      newErrors.push(issue.message)

      if (!field) {
        continue
      }

      fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
    }
  }

  const passwordResult = validatePassword(formData.password)
  if (!passwordResult.isValid) {
    newErrors.push(...passwordResult.errors)
    fieldErrors.password = [
      ...new Set([...(fieldErrors.password ?? []), ...passwordResult.errors]),
    ]
  }

  if (newErrors.length === 0) {
    return { isValid: true, errors: [], fieldErrors: {} }
  }

  return {
    isValid: false,
    errors: [...new Set(newErrors)],
    fieldErrors,
  }
}
