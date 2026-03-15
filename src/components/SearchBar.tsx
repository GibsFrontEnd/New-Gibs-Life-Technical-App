"use client"

import { useRef, useEffect } from "react"
import "../styles/SearchBar.css"

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

const SearchBar = ({ placeholder = "Search...", value, onChange }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // For backward compatibility - handle controlled and uncontrolled modes
  const isControlled = value !== undefined && onChange !== undefined

  // Handle keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="search-bar">
      <div className="search-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {isControlled ? (
        // Controlled input (for new functionality)
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        // Uncontrolled input (for backward compatibility)
        <input ref={inputRef} type="text" placeholder={placeholder} />
      )}
      {isControlled && value && (
        <button className="clear-button" onClick={() => onChange?.("")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <div className="keyboard-shortcut">
        <span>⌘ K</span>
      </div>
    </div>
  )
}

export default SearchBar
