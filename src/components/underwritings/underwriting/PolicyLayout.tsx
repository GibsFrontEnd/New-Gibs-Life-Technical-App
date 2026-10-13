//@ts-nocheck
import { Outlet, useParams, useLocation } from "react-router-dom";
import PolicyTabs from "./PolicyTabs";
import RenewalPolicyTabs from "./Renewals/RenewalPolicyTabs";
import EndorsementPolicyTabs from "./EndorsementPolicyTabs";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../features/store";
import { useEffect, useState } from "react";
import { fetchPolicies } from "../../../features/reducers/underwriteReducers/underwritingSlice";
import { Clock } from "lucide-react";
import PolicyAttachments from "./PolicyAttachments";

import { ComingSoonContext } from "./coming-soon-context";

const PolicyLayout = () => {
    const { policyNo: encodedPolicyNo } = useParams<{ policyNo: string }>()
const policyNo = encodedPolicyNo ? decodeURIComponent(encodedPolicyNo) : ''
    const dispatch = useDispatch();
    const location = useLocation();
    const [comingSoonTab, setComingSoonTab] = useState<string | null>(null);

    console.log("[PolicyLayout] render, comingSoonTab:", comingSoonTab, "path:", location.pathname);

    // Clear coming-soon whenever the route changes (user navigated to a real tab)
    useEffect(() => {
        console.log("[PolicyLayout] Route changed, clearing comingSoonTab. Path:", location.pathname);
        setComingSoonTab(null);
    }, [location.pathname]);

    // Get policies list (defensive: state.underwritings may be undefined on first render)
    const { policies = [] } = useSelector((state: RootState) => state.underwritings) || {};

    // Fetch policies if not loaded (needed for outdated check references)
    useEffect(() => {
        if (!policies || policies.length === 0) {
            dispatch(fetchPolicies({ page: 1, pageSize: 100, riskClass: "" }) as any);
        }
    }, [dispatch, policies]);

    // Inline outdated/renewed check (no external hook dependency)
    const currentPolicy = policies?.find((p: any) => p.proposalNo === policyNo);
    const isOutdated = currentPolicy?.transSTATUS === "OUTDATED" || false;
    const isRenewed = currentPolicy?.transSTATUS === "RENEWED" || false;

    // Secure check: only trust internal state
    const isReadOnly = isOutdated;

    // Determine if we're in renewal context
    const isRenewalContext = location.state?.fromRenewal || location.pathname.includes('/renewals/');
    // Determine if we're in endorsement context
    const isEndorsementContext = location.state?.fromEndorsement || location.pathname.includes('/endorsements/');

    return (
        <ComingSoonContext.Provider value={{ comingSoonTab, setComingSoonTab }}>
            <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header / Tabs - Static at top */}
                <div className="flex-none bg-white z-10">
                    {isRenewalContext ? <RenewalPolicyTabs /> : isEndorsementContext ? <EndorsementPolicyTabs /> : <PolicyTabs />}
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto relative bg-[#f9fafb] no-scrollbar">
                    <div className="max-w-[1400px] mx-auto min-h-full">
                        {comingSoonTab === "attach" ? (
                            /* ── Real Attachments page ── */
                            <PolicyAttachments />
                        ) : comingSoonTab ? (
                            /* Generic Coming Soon Panel for all other placeholder tabs */
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: "400px",
                                padding: "48px 24px",
                                background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)",
                                borderRadius: "12px",
                                margin: "24px",
                                border: "1px dashed #c7d2fe",
                                textAlign: "center",
                            }}>
                                <div style={{
                                    width: "72px",
                                    height: "72px",
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "20px",
                                    boxShadow: "0 8px 24px rgba(99,102,241,0.25)",
                                }}>
                                    <Clock size={32} color="white" />
                                </div>
                                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e1b4b", marginBottom: "8px" }}>
                                    Coming Soon
                                </h2>
                                <p style={{ fontSize: "15px", color: "#6b7280", maxWidth: "360px", lineHeight: "1.6" }}>
                                    This feature is currently under development and will be available in a future update.
                                </p>
                            </div>
                        ) : (
                            <Outlet context={{ isReadOnly, isRenewed }} />
                        )}
                    </div>
                </div>
            </div>
        </ComingSoonContext.Provider>
    );
};

export default PolicyLayout;