import React from 'react'

const AdminSettings: React.FC = () => {
  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      
      <div className="settings-content">
        <div className="settings-section">
          <h3>System Settings</h3>
          <p>Configure system-wide settings and preferences</p>
        </div>
        
        <div className="settings-section">
          <h3>User Preferences</h3>
          <p>Manage your personal preferences and account settings</p>
        </div>
        
        <div className="settings-section">
          <h3>Security Settings</h3>
          <p>Configure security policies and access controls</p>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
