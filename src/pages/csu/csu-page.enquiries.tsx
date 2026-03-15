import { useState } from "react";
import EnquiriesPolicies from "@/components/csu/enquiries/enquiries.policies";
import EnquiriesClaims from "@/components/csu/enquiries/enquiries.claims";
import EnquiriesVehicles from "@/components/csu/enquiries/enquiries.vehicles";
import EnquiriesMarines from "@/components/csu/enquiries/enquiries.marines";
import EnquiriesNaicom from "@/components/csu/enquiries/enquiries.naicom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";

const tabs = [
  { title: "Policies", content: <EnquiriesPolicies /> },
  { title: "Claims", content: <EnquiriesClaims /> },
  { title: "Vehicles", content: <EnquiriesVehicles /> },
  { title: "Marine", content: <EnquiriesMarines /> },
  { title: "Naicom", content: <EnquiriesNaicom /> },
];

const CSUEnquiries = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.title);

  return (
    <div className="max-w-[1200px] mx-auto my-0">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-[#111827] m-0">Enquiries</h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.title}
              value={tab.title}
              className="flex-1 min-w-[100px] hover:bg-neutral-200"
            >
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent value={tab.title}>{tab.content}</TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CSUEnquiries;
