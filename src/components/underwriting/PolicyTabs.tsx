//@ts-nocheck
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FileText, Calculator, ScrollText, FileCode2, AlertCircle, Paperclip } from "lucide-react";

interface PolicyTabsProps {
  basePath?: string; // Optional base path for different modules
  showComingSoon?: boolean; // Whether to show coming soon tabs
  riskName?: string; // Optional risk name for calculator tab
  tabs?: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    path?: string;
    comingSoon?: boolean;
  }>;
}

const PolicyTabs = ({ 
  basePath = "/underwriting/edit", 
  showComingSoon = true,
  riskName = "Risk",
  tabs 
}: PolicyTabsProps) => {
    const navigate = useNavigate();
    const { policyNo, id } = useParams<{ policyNo?: string; id?: string }>();
    const location = useLocation();
    
    // Get the identifier from params (works for both policyNo and id)
    const identifier = policyNo || id || "";

    // Determine active tab based on path
    let activeTab = "details";
    if (location.pathname.includes("/calculator")) {
        activeTab = "calculator";
    } else if (location.pathname.includes("/policy-doc")) {
        activeTab = "policy-doc";
    } else if (location.pathname.includes("/debit-note")) {
        activeTab = "debit-note";
    }

    const handleTabClick = (tab: string) => {
        if (!identifier) return;

        switch (tab) {
            case "details":
                navigate(`${basePath}/${encodeURIComponent(identifier)}`);
                break;
            case "calculator":
                navigate(`${basePath}/${encodeURIComponent(identifier)}/calculator`);
                break;
            case "debit-note":
                navigate(`${basePath}/${encodeURIComponent(identifier)}/debit-note`);
                break;
            case "policy-doc":
                navigate(`${basePath}/${encodeURIComponent(identifier)}/policy-doc`);
                break;
            default:
                break;
        }
    };

    // Default tabs
    const defaultTabs = [
        { id: "details", label: "Policy Info", icon: <FileText className="w-4 h-4" /> },
        { id: "calculator", label: `${riskName} Details`, icon: <Calculator className="w-4 h-4" /> },
        { id: "debit-note", label: "Debit Notes", icon: <ScrollText className="w-4 h-4" /> },
        { id: "policy-doc", label: "Policy Doc", icon: <FileCode2 className="w-4 h-4" /> },
    ];

    const comingSoonTabs = showComingSoon ? [
        { id: "coins", label: "CoIns.(Ceded)", icon: <FileText className="w-4 h-4" />, comingSoon: true },
        { id: "orc", label: "ORC Notes", icon: <FileText className="w-4 h-4" />, comingSoon: true },
        { id: "claims", label: "Claim", icon: <AlertCircle className="w-4 h-4" />, comingSoon: true },
        { id: "attach", label: "Attachments", icon: <Paperclip className="w-4 h-4" />, comingSoon: true },
    ] : [];

    const allTabs = tabs || [...defaultTabs, ...comingSoonTabs];

    return (
        <div className="w-full bg-white border-b border-gray-200 mb-6">
            <div className="flex flex-nowrap overflow-x-auto gap-0 px-4 relative scrollbar-hide">
                {allTabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`flex items-center px-5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap gap-2 border-b-2 ${
                            activeTab === tab.id && !tab.comingSoon
                                ? "text-blue-600 border-blue-600" 
                                : tab.comingSoon
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                            if (!tab.comingSoon) {
                                handleTabClick(tab.id);
                            }
                        }}
                        disabled={tab.comingSoon}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.comingSoon && (
                            <span className="ml-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                Soon
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PolicyTabs;