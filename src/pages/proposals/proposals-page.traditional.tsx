import AgentProposal from "@/components/agent/AgentProposal";

const ProposalsTraditional = () => {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* <div>
        <h1 className="text-2xl font-semibold text-[#111827] m-0">
          Traditional Schemes
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor and review traditional-linked proposals.
        </p>
      </div> */}
      <AgentProposal proposalType="traditional" />
    </div>
  );
};

export default ProposalsTraditional;
