// @ts-nocheck

import AgentQuotation from "@/components/agent/AgentQuotation";

const QuotationsTraditional = () => {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* <div>
        <h1 className="text-2xl font-semibold text-[#111827] m-0">
          Traditional Quotes
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and manage traditional policy quotes.
        </p>
      </div> */}
      <AgentQuotation quotationType="traditional" />
    </div>
  );
};

export default QuotationsTraditional;
