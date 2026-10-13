import GroupLifeQuotation from "@/components/groupLife/GroupLifeQuotation";
import GroupLifeQuotationDetail from "@/components/groupLife/GroupLifeQuotationDetail";
import EditGroupLifeQuotationDetail from "@/components/groupLife/EditGroupLifeQuotationDetail";
import { useParams } from "react-router-dom";

const QuotationsGroupLife = () => {
  const { Param } = useParams<{ Param?: string }>();
  const param = Param ?? null;

  const tabs = (() => {
    console.log("🚦 Group Life Quotations Param:", param);
    if (!param) {
      return <GroupLifeQuotation />;
    }

    if (param == "new") {
      return <GroupLifeQuotationDetail />;
    }

    // Assuming param is an ID for existing quotation
    return <EditGroupLifeQuotationDetail />;
  })();

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      {/* <div>
        <h1 className="text-2xl font-semibold text-[#111827] m-0">
          Group Life Quotes
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor quotation activity for group life schemes.
        </p>
      </div> */}

      {tabs}
    </div>
  );
};

export default QuotationsGroupLife;
