// pages/proposals/proposals-page.policy-history.tsx
import PolicyHistory from "../../pages/customer/PolicyHistory";

const ProposalsPolicyHistory = () => {
  return (
    <div className="p-6">
      {/* Optional: Add a custom header for agent view */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Policy History</h1>
        <p className="text-gray-600">View and manage customer policies</p>
      </div>
      
      <PolicyHistory compact={true} isAgentView={true} />
    </div>
  );
};

export default ProposalsPolicyHistory;