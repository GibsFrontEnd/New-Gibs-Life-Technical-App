import React, { useState } from "react";
import "./AdminProducts.css";
import ProductsSubRiskSections from "@/components/admin/product-page/products.subRiskSections";
import ProductsRisks from "@/components/admin/product-page/products.risks";
import ProductSubRisk from "@/components/admin/product-page/product.sub-risk";
import SubRiskSMIManagement from "@/components/admin/product-page/product.sub-risk-smis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";

const tabs = [
  { title: "Product", content: <ProductSubRisk /> },
  { title: "Risks", content: <ProductsRisks /> },
  { title: "Sub-Risk Sections", content: <ProductsSubRiskSections /> },
  { title: "Sub-Risk SMI", content: <SubRiskSMIManagement /> },
];

const AdminProducts: React.FC = () => {
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

export default AdminProducts;
