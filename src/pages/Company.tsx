import React, { useState } from 'react'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import FormField from '../components/UI/FormField'
import CreateBranchModal from '../components/Modals/CreateBranchModal'
import CreateRegionModal from '../components/Modals/CreateRegionModal'
import './Company.css'

const Company: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Company')
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [showRegionModal, setShowRegionModal] = useState(false)
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyAddress: '',
    companyWebsite: '',
    companyAbbreviation: '',
    lockLedgerSuppress: '',
    lockUserDisableDays: '',
    closeAcctPeriodPermanently: '',
    sessionTimeoutMins: ''
  })

  const tabs = ['Company', 'Branches', 'Sales Channels']

  const handleCompanyDataChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleBranchSubmit = (data: any) => {
    console.log('Branch created:', data)
  }

  const handleRegionSubmit = (data: any) => {
    console.log('Region created:', data)
  }

  return (
    <div className="company-page">
      <div className="page-header">
        <h1>Company</h1>
      </div>

      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Company' && (
        <div className="company-form">
          <div className="form-grid">
            <div className="form-column">
              <FormField label="Company Name">
                <Input
                  value={companyData.companyName}
                  onChange={handleCompanyDataChange('companyName')}
                  className="input-yellow"
                />
              </FormField>

              <FormField label="Company Address">
                <Input
                  value={companyData.companyAddress}
                  onChange={handleCompanyDataChange('companyAddress')}
                  className="input-yellow"
                />
              </FormField>

              <FormField label="Company Website">
                <Input
                  value={companyData.companyWebsite}
                  onChange={handleCompanyDataChange('companyWebsite')}
                  className="input-yellow"
                />
              </FormField>

              <FormField label="Company Abbreviation">
                <Input
                  value={companyData.companyAbbreviation}
                  onChange={handleCompanyDataChange('companyAbbreviation')}
                  className="input-yellow"
                />
              </FormField>
            </div>

            <div className="form-column">
              <FormField label="Lock Ledger Suppress">
                <Input
                  value={companyData.lockLedgerSuppress}
                  onChange={handleCompanyDataChange('lockLedgerSuppress')}
                  className="input-yellow"
                />
              </FormField>

              <FormField label="Lock User (Disable Days)">
                <Input
                  value={companyData.lockUserDisableDays}
                  onChange={handleCompanyDataChange('lockUserDisableDays')}
                  className="input-yellow"
                />
              </FormField>

              <FormField label="Close Acct Period Permanently">
                <Input
                  value={companyData.closeAcctPeriodPermanently}
                  onChange={handleCompanyDataChange('closeAcctPeriodPermanently')}
                  className="input-yellow"
                />
              </FormField>

              <FormField label="Session Timeout (Mins)">
                <Input
                  value={companyData.sessionTimeoutMins}
                  onChange={handleCompanyDataChange('sessionTimeoutMins')}
                  className="input-yellow"
                />
              </FormField>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Branches' && (
        <div className="branches-section">
          <div className="section-header">
            <span>Loading...</span>
            <div className="action-buttons">
              <Button onClick={() => setShowRegionModal(true)}>
                + New Region...
              </Button>
              <Button onClick={() => setShowBranchModal(true)}>
                + New Branch...
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateBranchModal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        onSubmit={handleBranchSubmit}
      />

      <CreateRegionModal
        isOpen={showRegionModal}
        onClose={() => setShowRegionModal(false)}
        onSubmit={handleRegionSubmit}
      />
    </div>
  )
}

export default Company
