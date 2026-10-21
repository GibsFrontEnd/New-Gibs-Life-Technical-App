//@ts-nocheck
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchemeQuotations } from "../../features/reducers/proposalReducers/proposalsSlice";
import ConvertListView from "../../components/page/ConvertListView";

interface SchemeQuotationsPageProps {
  title: string;
  tag: string;
  /** Eyebrow + action button label. Defaults to "Convert to Scheme". */
  actionLabel?: string;
}

const SchemeQuotationsPage = ({ title, tag, actionLabel = "Convert to Scheme" }: SchemeQuotationsPageProps) => {
  const dispatch = useDispatch();
  const { schemeItems: items, schemeLoading: loading, schemeError: error } = useSelector((s: any) => s.investmentProposals);

  useEffect(() => {
    dispatch(fetchSchemeQuotations(tag));
  }, [dispatch, tag]);

  return (
    <ConvertListView
      key={tag}
      eyebrow={actionLabel}
      title={title}
      description="Pick a quotation to take forward."
      items={items}
      loading={loading}
      error={error}
      onRetry={() => dispatch(fetchSchemeQuotations(tag))}
      noun="quotation"
      getId={(p) => String(p.quoteID ?? p.quoteNo)}
      getNo={(p) => p.quoteNo}
      getAltNo={(p) => p.proposalNo}
      clientDetail={(p) => [p.customerType, p.sex, p.age ? `Age ${p.age}` : null].filter(Boolean).join(" · ")}
      actionLabel={actionLabel}
      onAction={(p) => {
        alert(`${actionLabel}: ${p.quoteNo}`);
        // TODO: wire up API call
      }}
    />
  );
};

export default SchemeQuotationsPage;
