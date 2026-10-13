import React, { useState } from 'react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import Input from '../UI/Input'
import FormField from '../UI/FormField'

interface CreateBranchModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    branchCode: '',
    branchName: '',
    alternateName: '',
    address: '',
    state: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      branchCode: '',
      branchName: '',
      alternateName: '',
      address: '',
      state: ''
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Branch">
      <form onSubmit={handleSubmit}>
        <FormField label="Branch Code">
          <Input
            value={formData.branchCode}
            onChange={handleChange('branchCode')}
            required
          />
        </FormField>

        <FormField label="Branch Name">
          <Input
            value={formData.branchName}
            onChange={handleChange('branchName')}
            required
          />
        </FormField>

        <FormField label="Alternate Name">
          <Input
            value={formData.alternateName}
            onChange={handleChange('alternateName')}
          />
        </FormField>

        <FormField label="Address">
          <Input
            value={formData.address}
            onChange={handleChange('address')}
            required
          />
        </FormField>

        <FormField label="State">
          <Input
            value={formData.state}
            onChange={handleChange('state')}
            required
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button type="submit">
            📄 Create Branch
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateBranchModal
