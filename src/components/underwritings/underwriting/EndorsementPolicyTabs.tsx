//@ts-nocheck
//@ts-nocheck
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FileText, Calculator, File, ScrollText, AlertCircle, Paperclip } from "lucide-react";
import type { RootState } from "../../../features/store";
import "./PolicyTabs.css";
import { useComingSoon } from "./coming-soon-context";

const EndorsementPolicyTabs = () => {
    const navigate = useNavigate();
    const { policyNo } = useParams<{ policyNo: string }>();
    const location = useLocation();
    const { comingSoonTab, setComingSoonTab } = useComingSoon();

    console.log("[EndorsementPolicyTabs] render, comingSoonTab:", comingSoonTab);

    const { currentPolicy } = useSelector((state: RootState) => state.underwritings);
    const { risks } = useSelector((state: RootState) => state.risks);

    let activeTab = "details";
    // "/calculate" also matches "/calculator"; the per-calculation endorsement screens
    // (/fire/:detailID, /motor/:detailID) belong to the same tab.
    if (/\/(calculate|fire|motor)(\/|$)/.test(location.pathname) || location.pathname.includes("/calculate")) {
        activeTab = "calculator";
    } else if (location.pathname.includes("/documents")) {
        activeTab = "documents";
    } else if (location.pathname.includes("/debit-note")) {
        activeTab = "debit-note";
    } else if (location.pathname.includes("/policy")) {
        activeTab = "policy";
    }

    const handleTabClick = (tab: string) => {
        if (!policyNo) return;
        setComingSoonTab(null);

        switch (tab) {
            case "details":
                navigate(`/underwriting/endorsements/edit/${encodeURIComponent(policyNo)}`);
                break;
            case "calculator":
                navigate(`/underwriting/endorsements/calculate/${encodeURIComponent(policyNo)}`);
                break;
                            case "policy":
                navigate(`/underwriting/endorsements/policy/edit/${encodeURIComponent(policyNo)}`);
                break;
            case "debit-note":
                navigate(`/underwriting/endorsements/edit/${encodeURIComponent(policyNo)}/debit-note`);
                break;
            case "documents":
            case "endorsements":
            case "claims":
                break;
        }
    };

    const handleComingSoonTab = (tabName: string) => {
        setComingSoonTab(tabName);
    };

    const riskName = risks.find(r => r.riskID === currentPolicy?.riskID)?.riskName || "Risk";

    return (
        <div className="pc-tabs-container">
            <div className="pc-tabs-list">
                <button
                    className={`pc-tab-item ${activeTab === "details" && !comingSoonTab ? "active" : ""}`}
                    onClick={() => handleTabClick("details")}
                >
                    <div className="pc-tab-divider"></div>
                    <FileText className="w-4 h-4 mr-2" />
                    Policy Info
                </button>
                <button
                    className={`pc-tab-item ${activeTab === "calculator" && !comingSoonTab ? "active" : ""}`}
                    onClick={() => handleTabClick("calculator")}
                >
                    <div className="pc-tab-divider"></div>
                    <Calculator className="w-4 h-4 mr-2" />
                    {riskName} Endorsement Details
                </button>
                          <button
                    className={`pc-tab-item ${activeTab === "policy" && !comingSoonTab ? "active" : ""}`}
                    onClick={() => handleTabClick("policy")}
                >
                    <div className="pc-tab-divider"></div>
                    <Calculator className="w-4 h-4 mr-2" />
                    {riskName} Edit Details
                </button>
                <button
                    className={`pc-tab-item ${activeTab === "debit-note" && !comingSoonTab ? "active" : ""}`}
                    onClick={() => handleTabClick("debit-note")}
                >
                    <div className="pc-tab-divider"></div>
                    <ScrollText className="w-4 h-4 mr-2" />
                    Debit Notes
                </button>
                <button
                    className={`pc-tab-item ${comingSoonTab === "coins" ? "active" : ""}`}
                    onClick={() => handleComingSoonTab("coins")}
                >
                    <div className="pc-tab-divider"></div>
                    <FileText className="w-4 h-4 mr-2" />
                    CoIns.(Ceded) <span className="pc-badge-soon">Soon</span>
                </button>
                <button
                    className={`pc-tab-item ${comingSoonTab === "orc" ? "active" : ""}`}
                    onClick={() => handleComingSoonTab("orc")}
                >
                    <div className="pc-tab-divider"></div>
                    <FileText className="w-4 h-4 mr-2" />
                    ORC Notes <span className="pc-badge-soon">Soon</span>
                </button>
                <button
                    className={`pc-tab-item ${comingSoonTab === "documents" ? "active" : ""}`}
                    onClick={() => handleComingSoonTab("documents")}
                >
                    <div className="pc-tab-divider"></div>
                    <File className="w-4 h-4 mr-2" />
                    Policy Doc <span className="pc-badge-soon">Soon</span>
                </button>
                <button
                    className={`pc-tab-item ${comingSoonTab === "claims" ? "active" : ""}`}
                    onClick={() => handleComingSoonTab("claims")}
                >
                    <div className="pc-tab-divider"></div>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Claim <span className="pc-badge-soon">Soon</span>
                </button>
                <button
                    className={`pc-tab-item ${comingSoonTab === "attach" ? "active" : ""}`}
                    onClick={() => handleComingSoonTab("attach")}
                >
                    <div className="pc-tab-divider"></div>
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attachments
                </button>
            </div>
        </div>
    );
};

export default EndorsementPolicyTabs;
