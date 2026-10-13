//@ts-nocheck
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FileText, Calculator, File, ScrollText, AlertCircle, Paperclip, FileCode2 } from "lucide-react";
import type { RootState } from "../../../features/store";
import { useComingSoon } from "./coming-soon-context";
import { useToast } from "@/components/ui/use-toast";

// ✅ Import the DebitNoteList and CreditNotesTab components
import DebitNoteList from "../../groupLife/DebitNoteList";
import CreditNotesTab from "../../groupLife/CreditNotesTab";

const PolicyTabs = () => {
    const navigate = useNavigate();
    const { policyNo } = useParams<{ policyNo: string }>();
    const location = useLocation();
    const { comingSoonTab, setComingSoonTab } = useComingSoon();
    const { toast } = useToast();

    console.log("[PolicyTabs] render, comingSoonTab:", comingSoonTab);
    console.log("[PolicyTabs] location.pathname:", location.pathname);

    const { currentPolicy = null } = useSelector((state: RootState) => state.underwritings) || {};
    const { risks = [] } = useSelector((state: RootState) => state.risks) || {};

    // Determine active tab based on path
    let activeTab = "details";
    if (location.pathname.includes("/calculator")) {
        activeTab = "calculator";
    } else if (location.pathname.includes("/policy-doc")) {
        activeTab = "policy-doc";
    } else if (location.pathname.includes("/debit-note")) {
        activeTab = "debit-note";
    } else if (location.pathname.includes("/credit-note")) {
        activeTab = "credit-note";
    } else if (location.pathname.includes("/coinsurance")) {
        activeTab = "coinsurance";
    } else if (location.pathname.includes("/motor/")) {
        activeTab = "calculator";
    }

    const handleTabClick = (tab: string) => {
        if (!policyNo) return;
        setComingSoonTab(null);

        const encodedPolicyNo = encodeURIComponent(policyNo);
        const isMotorPath = location.pathname.includes('/motor/');
        const basePath = `/underwriting/edit/${encodedPolicyNo}`;
        
        const routes: Record<string, string> = {
            "details": basePath,
            "calculator": isMotorPath ? `${basePath}/motor` : `${basePath}/calculator`,
            "debit-note": `${basePath}/debit-note`,
            "credit-note": `${basePath}/credit-note`,
            "policy-doc": `${basePath}/policy-doc`,
        };

        if (routes[tab]) {
            console.log(`[PolicyTabs] Navigating to: ${routes[tab]}`);
            navigate(routes[tab]);
        }
    };

    const handleComingSoonTab = (tabName: string) => {
        setComingSoonTab(tabName);
       
    };

    const riskName = risks.find(r => r.riskID === currentPolicy?.riskID)?.riskName || "Risk";

    const getTabStyles = (tab: string, isComingSoon: boolean = false) => {
        const isActive = isComingSoon 
            ? comingSoonTab === tab 
            : activeTab === tab && !comingSoonTab;
        
        return `relative flex items-center px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
            isActive 
                ? 'text-blue-600 border-blue-600 bg-blue-50/50' 
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50'
        }`;
    };

    // ✅ Render the content based on active tab
    const renderTabContent = () => {
        if (comingSoonTab === "attach") {
            return (
                <div >
                   
                </div>
            );
        }

        switch (activeTab) {
            case "details":
                return (
                    <div >
                       
                    </div>
                );
            case "calculator":
                return (
                    <div >
                        
                    </div>
                );
            case "debit-note":
                // ✅ Render the DebitNoteList component
                return (
                    <div className="p-4">
                        <DebitNoteList policyNo={policyNo} />
                    </div>
                );
            case "credit-note":
                // ✅ Render the CreditNotesTab component
                return (
                    <div className="p-4">
                        <CreditNotesTab policyNo={policyNo} />
                    </div>
                );
            default:
                return (
                    <div >
                       
                    </div>
                );
        }
    };

    return (
        <div className="w-full bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center overflow-x-auto px-4 space-x-10">
                {/* Policy Info Tab */}
                <button
                    className={getTabStyles("details")}
                    onClick={() => handleTabClick("details")}
                >
                    <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Policy Info</span>
                </button>

                {/* Risk Details Tab */}
                <button
                    className={getTabStyles("calculator")}
                    onClick={() => handleTabClick("calculator")}
                >
                    <Calculator className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{riskName} Details</span>
                </button>

                {/* Debit Notes Tab */}
                <button
                    className={getTabStyles("debit-note")}
                    onClick={() => handleTabClick("debit-note")}
                >
                    <ScrollText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Debit Notes</span>
                </button>

                {/* CoIns.(Credit Note) Tab */}
                <button
                    className={getTabStyles("credit-note")}
                    onClick={() => handleTabClick("credit-note")}
                >
                    <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>CoIns.(Credit Note)</span>
                </button>

                {/* Attachments Tab - Coming Soon */}
                <button
                    className={getTabStyles("attach", true)}
                    onClick={() => handleComingSoonTab("attach")}
                >
                    <Paperclip className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Attachments</span>
                </button>
            </div>

            {/* ✅ Render the content below the tabs */}
            <div className="mt-4">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default PolicyTabs;