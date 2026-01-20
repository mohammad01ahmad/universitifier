export const validatePasswordWithData = (data = formData) => {
    const passwordErrors = []
    if (data.password.length < 8) {
      passwordErrors.push('Password must be at least 8 characters long')
    }
    if (!data.password.match(/[A-Z]/)) {
      passwordErrors.push('Password must contain at least one uppercase letter')
    }
    if (!data.password.match(/[a-z]/)) {
      passwordErrors.push('Password must contain at least one lowercase letter')
    }
    if (!data.password.match(/\d/)) {
      passwordErrors.push('Password must contain at least one number')
    }
    if (!data.password.match(/[@$!%*?&]/)) {
      passwordErrors.push('Password must contain at least one special character')
    }
    if (passwordErrors.length === 0) {
      return true
    }
    return passwordErrors
}