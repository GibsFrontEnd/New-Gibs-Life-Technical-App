import React from 'react'
import './Input.css'

// Any native <input> attribute is passed through (min/max/step/list/onFocus/autoComplete...);
// the old explicit prop list silently dropped them.
type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input: React.FC<InputProps> = ({
  type = 'text',
  className = '',
  disabled = false,
  required = false,
  onFocus,
  ...rest
}) => {
  // Number boxes usually hold a default like 0: select it on focus so typing replaces it
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number') e.target.select()
    onFocus?.(e)
  }

  return (
    <input
      {...rest}
      type={type}
      disabled={disabled}
      required={required}
      onFocus={handleFocus}
      className={`input ${className}`}
    />
  )
}

export default Input
