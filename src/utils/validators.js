// User validation
export const validateUser = (data) => {
  const errors = {}

  if (!data.name) errors.name = "Name is required"
  if (!data.email) errors.email = "Email is required"
  if (data.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
    errors.email = "Please provide a valid email"
  }

  if (!data.password) errors.password = "Password is required"
  if (data.password && data.password.length < 6) {
    errors.password = "Password must be at least 6 characters"
  }

  if (data.role === "student" && !data.college) {
    errors.college = "College is required for students"
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}

// Event validation
export const validateEvent = (data) => {
  const errors = {}

  if (!data.title) errors.title = "Title is required"
  if (!data.description) errors.description = "Description is required"
  if (!data.startDate) errors.startDate = "Start date is required"
  if (!data.endDate) errors.endDate = "End date is required"
  if (!data.registrationDeadline) errors.registrationDeadline = "Registration deadline is required"
  if (!data.location) errors.location = "Location is required"

  // Check if dates are valid
  if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
    errors.endDate = "End date must be after start date"
  }

  if (data.registrationDeadline && data.startDate && new Date(data.registrationDeadline) > new Date(data.startDate)) {
    errors.registrationDeadline = "Registration deadline must be before start date"
  }

  // Check if virtual event has meeting link
  if (data.isVirtual && !data.meetingLink) {
    errors.meetingLink = "Meeting link is required for virtual events"
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}

// Registration validation
export const validateRegistration = (data) => {
  const errors = {}

  if (!data.user) errors.user = "User ID is required"
  if (!data.event) errors.event = "Event ID is required"

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}

// Category validation
export const validateCategory = (data) => {
  const errors = {}

  if (!data.name) errors.name = "Category name is required"
  if (data.name && data.name.length > 50) {
    errors.name = "Category name cannot be more than 50 characters"
  }

  if (data.description && data.description.length > 200) {
    errors.description = "Description cannot be more than 200 characters"
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}
