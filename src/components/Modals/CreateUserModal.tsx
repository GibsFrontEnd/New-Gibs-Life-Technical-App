import React, { useState } from 'react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import Input from '../UI/Input'
import Select from '../UI/Select'
import FormField from '../UI/FormField'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    sex: '',
    status: 'Active/Inactive'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      sex: '',
      status: 'Active/Inactive'
    })
    onClose()
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
      <form onSubmit={handleSubmit}>
        <FormField label="Username">
          <Input
            value={formData.username}
            onChange={handleChange('username')}
            required
          />
        </FormField>

        <FormField label="First Name">
          <Input
            value={formData.firstName}
            onChange={handleChange('firstName')}
            required
          />
        </FormField>

        <FormField label="Last Name">
          <Input
            value={formData.lastName}
            onChange={handleChange('lastName')}
            required
          />
        </FormField>

        <FormField label="Email">
          <Input
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            required
          />
        </FormField>

        <FormField label="Phone">
          <Input
            type="tel"
            value={formData.phone}
            onChange={handleChange('phone')}
            required
          />
        </FormField>

        <FormField label="Sex">
          <Input
            value={formData.sex}
            onChange={handleChange('sex')}
            required
          />
        </FormField>

        <FormField label="Status">
          <Select
            options={statusOptions}
            value={formData.status}
            onChange={handleChange('status')}
            placeholder="Active/Inactive"
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

export default CreateUserModal
