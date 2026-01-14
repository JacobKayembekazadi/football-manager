/**
 * Password Validation Utility
 *
 * Provides password strength checking and validation
 * for enhanced security during signup.
 */

export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-4 (weak to strong)
  strength: 'weak' | 'fair' | 'good' | 'strong';
  errors: string[];
  suggestions: string[];
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

/**
 * Check password requirements
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

/**
 * Calculate password strength score (0-4)
 */
function calculateScore(requirements: PasswordRequirements, password: string): number {
  let score = 0;

  // Base requirements (each worth 1 point)
  if (requirements.minLength) score += 1;
  if (requirements.hasUppercase) score += 1;
  if (requirements.hasLowercase) score += 1;
  if (requirements.hasNumber) score += 1;

  // Bonus for special characters
  if (requirements.hasSpecial) score += 0.5;

  // Bonus for length > 12
  if (password.length >= 12) score += 0.5;

  // Cap at 4
  return Math.min(4, Math.round(score));
}

/**
 * Get strength label from score
 */
function getStrengthLabel(score: number): 'weak' | 'fair' | 'good' | 'strong' {
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

/**
 * Validate password and return detailed feedback
 */
export function validatePassword(password: string): PasswordValidation {
  const requirements = checkPasswordRequirements(password);
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check minimum requirements
  if (!requirements.minLength) {
    errors.push('Password must be at least 8 characters');
  }

  if (!requirements.hasUppercase) {
    errors.push('Password must contain an uppercase letter');
  }

  if (!requirements.hasLowercase) {
    errors.push('Password must contain a lowercase letter');
  }

  if (!requirements.hasNumber) {
    errors.push('Password must contain a number');
  }

  // Suggestions for stronger passwords
  if (!requirements.hasSpecial) {
    suggestions.push('Add special characters (!@#$%^&*) for stronger security');
  }

  if (password.length < 12) {
    suggestions.push('Use 12+ characters for better security');
  }

  // Check for common weak patterns
  if (/^[a-zA-Z]+$/.test(password)) {
    suggestions.push('Mix in numbers and symbols');
  }

  if (/(.)\1{2,}/.test(password)) {
    suggestions.push('Avoid repeated characters');
  }

  const score = calculateScore(requirements, password);
  const strength = getStrengthLabel(score);
  const isValid = errors.length === 0;

  return {
    isValid,
    score,
    strength,
    errors,
    suggestions,
  };
}

/**
 * Get color class for password strength indicator
 */
export function getStrengthColor(strength: 'weak' | 'fair' | 'good' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'fair':
      return 'bg-amber-500';
    case 'good':
      return 'bg-blue-500';
    case 'strong':
      return 'bg-green-500';
  }
}

/**
 * Get text color class for password strength label
 */
export function getStrengthTextColor(strength: 'weak' | 'fair' | 'good' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-400';
    case 'fair':
      return 'text-amber-400';
    case 'good':
      return 'text-blue-400';
    case 'strong':
      return 'text-green-400';
  }
}
