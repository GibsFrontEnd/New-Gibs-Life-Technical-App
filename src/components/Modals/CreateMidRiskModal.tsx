import React, { useState } from 'react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import Input from '../UI/Input'
import FormField from '../UI/FormField'

interface CreateMidRiskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

const CreateMidRiskModal: React.FC<CreateMidRiskModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    midRiskCode: '',
    midRiskName: '',
    mainRisk: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      midRiskCode: '',
      midRiskName: '',
      mainRisk: ''
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Mid-Risk">
      <form onSubmit={handleSubmit}>
        <FormField label="Mid-Risk Code">
          <Input
            value={formData.midRiskCode}
            onChange={handleChange('midRiskCode')}
            required
          />
        </FormField>

        <FormField label="Mid-Risk Name">
          <Input
            value={formData.midRiskName}
            onChange={handleChange('midRiskName')}
            required
          />
        </FormField>

        <FormField label="Main-Risk">
          <Input
            value={formData.mainRisk}
            onChange={handleChange('mainRisk')}
            required
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button type="submit">
            📄 Create Mid-Risk
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateMidRiskModal
