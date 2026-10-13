import EditGroupLifeQuotationDetail from "../../components/groupLife/EditGroupLifeQuotationDetail";
const GroupLifeQuotationEdit: React.FC = () => {
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
      <EditGroupLifeQuotationDetail />
    </div>
  );
};

export default GroupLifeQuotationEdit;

