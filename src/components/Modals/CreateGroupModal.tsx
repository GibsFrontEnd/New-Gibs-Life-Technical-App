import React, { useState } from 'react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import Input from '../UI/Input'
import FormField from '../UI/FormField'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    groupId: '',
    groupName: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      groupId: '',
      groupName: ''
    })
    onClose()
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group" size="sm">
      <form onSubmit={handleSubmit}>
        <FormField label="Group ID">
          <Input
            value={formData.groupId}
            onChange={handleChange('groupId')}
            required
          />
        </FormField>

        <FormField label="Group Name">
          <Input
            value={formData.groupName}
            onChange={handleChange('groupName')}
            required
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button type="submit">
            📄 Create Group
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateGroupModal
