// hooks/use-proposal-pdf.ts

// @ts-nocheck

import { useDispatch, useSelector } from "react-redux";
// import { fetcQuotationReport, clearMessages } from "../features/reducers/quotationReducers/quotationSlice";
import { useToast } from "../hooks/use-toast";

const useProposalPDF = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();const quotationsState = useSelector((state: any) => state.quotations || {});

  const downloadPDF = async (quoteNo: string) => {
    try {
      dispatch(fetchQuotationReport(quoteNo) as any);
    } catch (err) {
      toast({
        title: "Download Failed",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  return { downloadPDF };
};

export default useProposalPDF;