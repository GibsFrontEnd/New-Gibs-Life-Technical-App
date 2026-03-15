import React from 'react'

const AdminFeatures: React.FC = () => {
  return (
    <div className="features-page">
      <div className="page-header">
        <h1>Features</h1>
      </div>
      
      <div className="features-content">
        <div className="feature-card">
          <h3>User Management</h3>
          <p>Comprehensive user management system with role-based access control</p>
        </div>
        
        <div className="feature-card">
          <h3>Product Management</h3>
          <p>Manage your products, risks, and categories efficiently</p>
        </div>
        
        <div className="feature-card">
          <h3>Company Settings</h3>
          <p>Configure company information and system settings</p>
        </div>
        
        <div className="feature-card">
          <h3>Security</h3>
          <p>Advanced security features including audit logs and session management</p>
        </div>
      </div>
    </div>
  )
}

export default AdminFeatures
