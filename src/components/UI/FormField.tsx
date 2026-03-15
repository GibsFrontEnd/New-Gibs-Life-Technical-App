import React from 'react'
import './FormField.css'

interface FormFieldProps {
  label: string
  children: React.ReactNode
  required?: boolean
  error?: string
  className?: string
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  required = false,
  error,
  className = ''
}) => {
  return (
    <div className={`form-field ${className}`}>
      <label className="form-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export default FormField
