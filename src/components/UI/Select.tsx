import React from 'react'
import './Select.css'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  name?: string
  id?: string
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  name,
  id
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`select ${className}`}
      name={name}
      id={id}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}


export default Select
