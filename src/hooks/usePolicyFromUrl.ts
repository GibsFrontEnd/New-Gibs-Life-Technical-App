// An individual policy's edit page opened by its address (refresh, bookmark, shared link) has no router state,
// so the policy is loaded from ?policyNo= instead. Opened from the Policy Admin list the row arrives in state.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import apiCall from "../utils/api-call";

export const usePolicyFromUrl = (isEditMode: boolean, stateData: any) => {
  const [searchParams] = useSearchParams();
  const policyNo = searchParams.get("policyNo") || "";
  const [policy, setPolicy] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditMode || stateData || !policyNo) return;
    let cancelled = false;
    setError("");
    apiCall
      .get("/v1/lifepolicyAdmin/policies", { params: { policyNo, pageSize: 10 } })
      .then((r) => {
        const rows: any[] = r.data?.items || r.data?.Items || [];
        const hit = rows.find((p) => String(p.policyNo || "").toLowerCase() === policyNo.toLowerCase());
        if (cancelled) return;
        if (hit) setPolicy(hit);
        else setError(`Policy ${policyNo} was not found.`);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message || "Couldn't load the policy.");
      });
    return () => {
      cancelled = true;
    };
  }, [isEditMode, stateData, policyNo]);

  return { policy, error, policyNo };
};
