//@ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Landmark, TrendingUp } from "lucide-react";
import { fetchInvestmentProposals } from "../../features/reducers/proposalReducers/proposalsSlice";
import ConvertListView from "../../components/page/ConvertListView";

const InvestmentPoliciesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, error } = useSelector((s: any) => s.investmentProposals);

  // B = Investment, A = Traditional
  const [activeTag, setActiveTag] = useState<"A" | "B">("B");

  useEffect(() => {
    dispatch(fetchInvestmentProposals({ tag: activeTag, pageSize: 500 }));
  }, [dispatch, activeTag]);

  // the API might return both tags, so keep to the active one
  const rows = useMemo(() => (items ?? []).filter((p: any) => !p.tag || p.tag === activeTag), [items, activeTag]);

  return (
    <ConvertListView
      key={activeTag}
      eyebrow="Convert to policy"
      title={activeTag === "B" ? "Investment proposals" : "Traditional proposals"}
      description="Pick a proposal and convert it into a policy."
      tabs={[
        { value: "B", label: "Investment", icon: TrendingUp },
        { value: "A", label: "Traditional", icon: Landmark },
      ]}
      tab={activeTag}
      onTab={(v) => setActiveTag(v as "A" | "B")}
      items={rows}
      loading={loading}
      error={error}
      onRetry={() => dispatch(fetchInvestmentProposals({ tag: activeTag, pageSize: 500 }))}
      noun="proposal"
      getId={(p) => p.transGUID || p.proposalNo}
      getNo={(p) => p.proposalNo || p.policyNo}
      getAltNo={(p) => (p.policyNo && p.policyNo !== p.proposalNo ? p.policyNo : undefined)}
      actionLabel="Convert to policy"
      onAction={(p) => navigate(`/underwriting/convert-to-policy/investment-policies/${p.proposalNo}`)}
    />
  );
};

export default InvestmentPoliciesPage;
