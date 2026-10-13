// features/claims/pages/ClaimCreatePage.tsx
//@ts-nocheck

import { useParams } from "react-router-dom";
import { ClaimFormPage } from "./ClaimsFormPage";

 const ClaimCreatePage = () => {
  const { claimType } = useParams();
  
  // Map URL parameter to loss type
  const lossTypeMap: Record<string, string> = {
    "maturity": "Maturity",
    "surrender": "Surrender",
    "partial-withdrawal": "Partial Withdrawal",
    "death-benefit": "Death Benefit",
  };
  
  const lossType = lossTypeMap[claimType] || "";
  
  return <ClaimFormPage mode="create" lossType={lossType} />;
};

export default ClaimCreatePage;