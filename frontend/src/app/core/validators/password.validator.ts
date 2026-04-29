import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const strongPasswordValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;

  const hasUpperCase  = /[A-Z]/.test(value);
  const hasLowerCase  = /[a-z]/.test(value);
  const hasNumber     = /[0-9]/.test(value);
  const hasSymbol     = /[!@#$%^&*()_+\-=\$\${};':"\\|,.<>\/?]/.test(value);
  const hasMinLength  = value.length >= 8;

  const errors: ValidationErrors = {};

  if (!hasMinLength)  errors['minLength']  = true;
  if (!hasUpperCase)  errors['upperCase']  = true;
  if (!hasLowerCase)  errors['lowerCase']  = true;
  if (!hasNumber)     errors['number']     = true;
  if (!hasSymbol)     errors['symbol']     = true;

  return Object.keys(errors).length > 0 ? errors : null;
};