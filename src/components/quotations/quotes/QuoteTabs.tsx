//@ts-nocheck
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FileText, Calculator } from "lucide-react";

interface QuoteTabsProps {
  riskName?: string;
  proposalNo?: string;
}

const QuoteTabs = ({ riskName = "Risk", proposalNo: propProposalNo }: QuoteTabsProps) => {
  const navigate = useNavigate();
  const { proposalNo: paramProposalNo } = useParams<{ proposalNo: string }>();
  const location = useLocation();
  
  const activeProposalNo = propProposalNo || paramProposalNo;

  // Determine active tab based on path
  let activeTab = "details";
  if (location.pathname.includes("/quote") || location.pathname.includes("/quote-details")) {
    activeTab = "quote-details";
  }

  const handleTabClick = (tab: string) => {
    if (!activeProposalNo) return;

    switch (tab) {
      case "details":
        navigate(`/quotations/edit/${encodeURIComponent(activeProposalNo)}`);
        break;
      case "quote-details":
        // Navigate to the quote details page
        if (riskName === "Motor") {
          navigate(`/quotations/quote/motor/${activeProposalNo}`);
        } else {
          navigate(`/quotations/quote/${activeProposalNo}`);
        }
        break;
    }
  };

  return (
    <div className="pc-tabs-container">
      <div className="pc-tabs-list">
        <button
          className={`pc-tab-item ${activeTab === "details" ? "active" : ""}`}
          onClick={() => handleTabClick("details")}
        >
          <div className="pc-tab-divider"></div>
          <FileText className="w-4 h-4 mr-2" />
          Quotation Information
        </button>
        <button
          className={`pc-tab-item ${activeTab === "quote-details" ? "active" : ""}`}
          onClick={() => handleTabClick("quote-details")}
        >
          <div className="pc-tab-divider"></div>
          <Calculator className="w-4 h-4 mr-2" />
          Quotation Details
        </button>
      </div>
    </div>
  );
};

export default QuoteTabs;