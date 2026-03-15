import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/use-apps";
import { clearProposals } from "@/features/reducers/proposalReducers/proposalSlice";
import AgentProposal from "@/components/agent/AgentProposal";

const ProposalsInvestmentLink = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(clearProposals());
  }, [dispatch]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <AgentProposal proposalType="investments" />
    </div>
  );
};

export default ProposalsInvestmentLink;
