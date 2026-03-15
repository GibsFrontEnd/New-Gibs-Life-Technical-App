import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import CompanySettings from "@/components/admin/company-page/company.settings";
import CompanyBranches from "@/components/admin/company-page/company.branches";
import CompanyRegions from "@/components/admin/company-page/company.regions";
import CompanyAutoNumbers from "@/components/admin/company-page/company.auto-numbers";
import CompanyDepartments from "@/components/admin/company-page/company.departments";
import CompanyApprovals from "@/components/admin/company-page/company.approvals";


const tabs = [
  { title: "Auto Numbers", content: <CompanyAutoNumbers /> },
  { title: "Branches", content: <CompanyBranches /> },
  { title: "Regions", content: <CompanyRegions /> }, 
  { title: "Departments", content: <CompanyDepartments /> },
  { title: "Department Approvals", content: <CompanyApprovals /> },
  { title: "Settings", content: <CompanySettings /> },
];

const AdminCompany = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.title);

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Products</h1>
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

export default AdminCompany;
