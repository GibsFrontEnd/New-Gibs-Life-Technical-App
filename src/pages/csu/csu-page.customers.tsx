import { useState } from "react";
import Customers from "../../components/csu/customers/customers.customers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";

const tabs = [{ title: "Customers", content: <Customers /> }];

const CSUCustomers = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.title);

  return (
    <div className="max-w-[1200px] mx-auto mb-10">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-[#111827] m-0">Customers</h1>
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
          <TabsContent key={tab.title} value={tab.title}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CSUCustomers;
