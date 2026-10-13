import React, { useState } from 'react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import Input from '../UI/Input'
import FormField from '../UI/FormField'

interface CreateSignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

const CreateSignatureModal: React.FC<CreateSignatureModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    file: null as File | null,
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      file: null,
      description: ''
    })
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({
      ...prev,
      file
    }))
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      description: e.target.value
    }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Signature">
      <form onSubmit={handleSubmit}>
        <FormField label="Choose Signature">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
              id="signature-file"
            />
            <label htmlFor="signature-file" style={{ 
              padding: '8px 16px', 
              background: '#f3f4f6', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Choose File
            </label>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {formData.file ? formData.file.name : 'No file chosen'}
            </span>
          </div>
        </FormField>

        <FormField label="Description">
          <Input
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Enter description..."
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button type="submit">
            📄 Create Signature
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateSignatureModal
