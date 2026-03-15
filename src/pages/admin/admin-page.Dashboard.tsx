import React from "react";
import "./AdminDashboard.css";

const AdminDashboard: React.FC = () => {

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="metrics-grid">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">hello 1</span>
              <div className="metric-icon">❓</div>
            </div>
            <div className="metric-value">200</div>
            <div className="metric-footer">
              <span className="metric-trend">↗ 12.00%</span>
              <span className="metric-description">
                something less important
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
