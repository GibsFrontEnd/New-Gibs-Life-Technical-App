import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/use-apps";
import {
  clearQuotations,
  getQuotations,
} from "@/features/reducers/quotationReducers/quotationSlice";
import AgentQuotation from "@/components/agent/AgentQuotation";

const IndividualLifeQuotations = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(clearQuotations());
    dispatch(getQuotations({ page: 1, pageSize: 20 }));
  }, [dispatch]);

  return (
    <div className="container mx-auto p-6">
      <AgentQuotation />
    </div>
  );
};

export default IndividualLifeQuotations;