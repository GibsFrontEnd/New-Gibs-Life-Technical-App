# GIBSLIFE ENTERPRISE 7 - UI Component Documentation

## Table of Contents

1. [Button Component](#button-component)
2. [Input Component](#input-component)
3. [Select Component](#select-component)
4. [Modal Component](#modal-component)
5. [FormField Component](#formfield-component)
6. [Layout Components](#layout-components)

---

## Button Component

**Location:** `src/components/UI/Button.tsx`

### Props

```typescript
interface ButtonProps {
  children: React.ReactNode; // Button text/content
  onClick?: () => void; // Click handler
  variant?: "primary" | "secondary" | "danger"; // Button style
  size?: "sm" | "md" | "lg"; // Button size
  disabled?: boolean; // Disabled state
  type?: "button" | "submit" | "reset"; // HTML button type
  className?: string; // Additional CSS classes
}
```

### Usage Examples

**Basic Primary Button:**

```typescriptreact
import Button from '../components/UI/Button'

<Button onClick={() => console.log('clicked')}>
  Click Me
</Button>
```

**Submit Button for Forms:**

```typescriptreact
<Button type="submit" variant="primary">
  📄 Create User
</Button>
```

**Secondary Button:**

```typescriptreact
<Button variant="secondary" size="sm">
  🔍
</Button>
```

**Disabled Button:**

```typescriptreact
<Button disabled>
  Loading...
</Button>
```

### Visual Examples

- **Primary**: Red background (`#dc2626`), white text
- **Secondary**: Gray background (`#6b7280`), white text
- **Danger**: Same as primary but semantically different
- **Sizes**: sm (6px padding), md (8px padding), lg (12px padding)

---

## Input Component

**Location:** `src/components/UI/Input.tsx`

### Props

```typescript
interface InputProps {
  type?: "text" | "email" | "password" | "number" | "tel";
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  id?: string;
}
```

### Usage Examples

**Basic Text Input:**

```typescriptreact
import Input from '../components/UI/Input'

const [name, setName] = useState('')

<Input
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

**Email Input with Validation:**

```typescriptreact
<Input
  type="email"
  placeholder="user@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>
```

**Yellow Company Form Input:**

```typescriptreact
<Input
  value={companyName}
  onChange={(e) => setCompanyName(e.target.value)}
  className="input-yellow"
/>
```

**Disabled Input:**

```typescriptreact
<Input
  value="Read only value"
  disabled
/>
```

### Special Classes

- **`input-yellow`**: Yellow background for company forms
- Default styling: White background, gray border, red focus border

---

## Select Component

**Location:** `src/components/UI/Select.tsx`

### Props

```typescript
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  id?: string;
}
```

### Usage Examples

**Basic Dropdown:**

```typescriptreact
import Select from '../components/UI/Select'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

<Select
  options={statusOptions}
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  placeholder="Select status"
/>
```

**Filter Dropdown:**

```typescriptreact
const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

<Select
  options={filterOptions}
  value="all"
  className="filter-select"
/>
```

---

## Modal Component

**Location:** `src/components/UI/Modal.tsx`

### Props

```typescript
interface ModalProps {
  isOpen: boolean; // Controls modal visibility
  onClose: () => void; // Function to close modal
  title: string; // Modal header title
  children: React.ReactNode; // Modal content
  size?: "sm" | "md" | "lg"; // Modal width
}
```

### Usage Examples

**Basic Modal:**

```typescriptreact
import Modal from '../components/UI/Modal'

const [showModal, setShowModal] = useState(false)

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Create New User"
>
  <p>Modal content goes here</p>
</Modal>
```

**Small Modal for Simple Forms:**

```typescriptreact
<Modal
  isOpen={showRoleModal}
  onClose={() => setShowRoleModal(false)}
  title="Create New Role"
  size="sm"
>
  <form>
    {/* Form content */}
  </form>
</Modal>
```

**Large Modal for Complex Forms:**

```typescriptreact
<Modal
  isOpen={showProductModal}
  onClose={() => setShowProductModal(false)}
  title="Create New Product"
  size="lg"
>
  <form>
    {/* Complex form with many fields */}
  </form>
</Modal>
```

### Modal Sizes

- **sm**: 400px max width
- **md**: 500px max width (default)
- **lg**: 700px max width

### Important Notes

- Modal automatically handles body scroll lock
- Clicking overlay closes modal
- ESC key support (built into browser)
- Proper z-index layering

---

## FormField Component

**Location:** `src/components/UI/FormField.tsx`

### Props

```typescript
interface FormFieldProps {
  label: string; // Field label text
  children: React.ReactNode; // Input component
  required?: boolean; // Shows red asterisk
  error?: string; // Error message to display
  className?: string; // Additional CSS classes
}
```

### Usage Examples

**Basic Form Field:**

```typescriptreact
import FormField from '../components/UI/FormField'
import Input from '../components/UI/Input'

<FormField label="Username">
  <Input
    value={username}
    onChange={(e) => setUsername(e.target.value)}
  />
</FormField>
```

**Required Field:**

```typescriptreact
<FormField label="Email Address" required>
  <Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />
</FormField>
```

**Field with Error:**

```typescriptreact
<FormField
  label="Password"
  required
  error="Password must be at least 8 characters"
>
  <Input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
</FormField>
```

**Field with Select:**

```typescriptreact
<FormField label="Status">
  <Select
    options={statusOptions}
    value={status}
    onChange={(e) => setStatus(e.target.value)}
  />
</FormField>
```

### Visual Styling

- Label appears above input with proper spacing
- Required asterisk is red
- Error messages appear below input in red
- Consistent margin-bottom for form spacing

---

## Layout Components

### Sidebar Component

**Location:** `src/components/Layout/Sidebar.tsx`

**Usage:**

```typescriptreact
import Sidebar from '../components/Layout/Sidebar'

// Used automatically in Layout component
// No props needed - uses React Router for navigation
```

**Features:**

- Automatic active state based on current route
- Responsive collapse on mobile
- Purple gradient background
- Menu items: Dashboard, Security, Products, Features, Settings

### Header Component

**Location:** `src/components/Layout/Header.tsx`

**Usage:**

```typescriptreact
import Header from '../components/Layout/Header'

// Used automatically in Layout component
// No props needed
```

**Features:**

- Horizontal navigation tabs
- User email display with dropdown arrow
- Notification bell icon
- Responsive horizontal scrolling on mobile

### Layout Component

**Location:** `src/components/Layout/Layout.tsx`

**Usage:**

```typescriptreact
import Layout from '../components/Layout/Layout'

<Layout>
  <YourPageContent />
</Layout>
```

**Features:**

- Combines Sidebar and Header
- Provides main content area
- Handles responsive layout
- Used as wrapper in App.tsx

---

## Complete Form Example

Here's how all components work together in a typical modal form:

```typescriptreact
import React, { useState } from 'react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import Input from '../UI/Input'
import Select from '../UI/Select'
import FormField from '../UI/FormField'

const CreateUserModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    status: ''
  })

  const [errors, setErrors] = useState({})

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    // Validation logic here
    onSubmit(formData)
    onClose()
  }

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
      <form onSubmit={handleSubmit}>
        <FormField
          label="Username"
          required
          error={errors.username}
        >
          <Input
            value={formData.username}
            onChange={handleChange('username')}
            required
          />
        </FormField>

        <FormField
          label="Email"
          required
          error={errors.email}
        >
          <Input
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            required
          />
        </FormField>

        <FormField label="Status">
          <Select
            options={statusOptions}
            value={formData.status}
            onChange={handleChange('status')}
            placeholder="Select status"
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button type="submit">
            📄 Create User
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

## Common Patterns

### Opening/Closing Modals

```typescriptreact
const [showModal, setShowModal] = useState(false)

// Open modal
<Button onClick={() => setShowModal(true)}>
  + Create User...
</Button>

// Modal component
<CreateUserModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleUserSubmit}
/>
```

### Form State Management

```typescriptreact
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
})

const handleChange = (field) => (e) => {
  setFormData(prev => ({
    ...prev,
    [field]: e.target.value
  }))
}
```

### Search and Filter UI

```typescriptreact
<div className="search-controls">
  <Input
    placeholder="Search..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="search-input"
  />
  <Select
    options={filterOptions}
    value={filter}
    onChange={(e) => setFilter(e.target.value)}
  />
  <Button variant="secondary" size="sm">🔍</Button>
</div>
```

This documentation should help you understand how to use each component effectively.
