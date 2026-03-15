import React, { useState } from "react";
import CreateUserModal from "@/components/Modals/CreateUserModal";
import CreateRoleModal from "@/components/Modals/CreateRoleModal";
import "./AdminSecurity.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/UI/tabs";
import SecurityUsers from "@/components/admin/security-page/security.users";
import SecurityRoles from "@/components/admin/security-page/security.roles";
import SecurityPermissions from "@/components/admin/security-page/security.permissions";

const AdminSecurity: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Users");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const tabs = [
    { title: "Users", content: <SecurityUsers /> },
    { title: "Roles", content: <SecurityRoles /> },
    { title: "Permissions", content: <SecurityPermissions /> },
  ];

  const handleUserSubmit = (data: any) => {
    console.log("User created:", data);
  };

  const handleRoleSubmit = (data: any) => {
    console.log("Role created:", data);
  };

  return (
    <div className="security-page">
      <div className="page-header">
        <h1>Security</h1>
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
          <TabsContent value={tab.title} className="mb-6">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>

      <CreateUserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSubmit={handleUserSubmit}
      />

      <CreateRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={handleRoleSubmit}
      />
    </div>
  );
};

export default AdminSecurity;
