import React, { useState } from 'react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import Input from '../UI/Input'
import FormField from '../UI/FormField'

interface CreateRegionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

const CreateRegionModal: React.FC<CreateRegionModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    regionCode: '',
    regionName: '',
    alternateName: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      regionCode: '',
      regionName: '',
      alternateName: ''
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Region">
      <form onSubmit={handleSubmit}>
        <FormField label="Region Code">
          <Input
            value={formData.regionCode}
            onChange={handleChange('regionCode')}
            required
          />
        </FormField>

        <FormField label="Region Name">
          <Input
            value={formData.regionName}
            onChange={handleChange('regionName')}
            required
          />
        </FormField>

        <FormField label="Alternate Name">
          <Input
            value={formData.alternateName}
            onChange={handleChange('alternateName')}
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button type="submit">
            📄 Create Region
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateRegionModal
