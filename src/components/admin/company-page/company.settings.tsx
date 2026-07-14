// src/pages/CompanySettings.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../UI/card";
import { Input } from "../../UI/new-input";
import { Label } from "../../UI/label";
import { Button } from "../../UI/new-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../UI/tabs";
import { Building2, Globe, Users, Shield, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";

const CompanySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    website: "",
    companyAbbreviation: "",
    passwordLength: "",
    resetDefaultPwd: "",
    initialPwdDays: "",
    changePwdDays: "",
    lockUserDays: "",
    proxy1Username: "",
    proxy1Password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Company settings updated successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
            <p className="text-sm text-gray-500">Manage company settings and configurations</p>
          </div>
        </div>

        {/* Tabs */}
        

       
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="companyName" className="text-sm font-medium text-black">
                          Company Name
                        </Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="mt-1 bg-white"
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="companyAddress" className="text-sm font-medium text-black">
                          Company Address
                        </Label>
                        <Input
                          id="companyAddress"
                          name="companyAddress"
                          value={formData.companyAddress}
                          onChange={handleInputChange}
                          className="mt-1 bg-white"
                          placeholder="Enter company address"
                        />
                      </div>

                      <div>
                        <Label htmlFor="website" className="text-sm font-medium text-black">
                          Website
                        </Label>
                        <Input
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          className="mt-1 bg-white"
                          placeholder="Enter website URL"
                        />
                      </div>

                      <div>
                        <Label htmlFor="companyAbbreviation" className="text-sm font-medium text-black">
                          Company Abbreviation
                        </Label>
                        <Input
                          id="companyAbbreviation"
                          name="companyAbbreviation"
                          value={formData.companyAbbreviation}
                          onChange={handleInputChange}
                          className="mt-1 bg-white"
                          placeholder="Enter company abbreviation"
                        />
                      </div>

                      <div>
                        <Label htmlFor="passwordLength" className="text-sm font-medium text-black">
                          Password Length
                        </Label>
                        <Input
                          id="passwordLength"
                          name="passwordLength"
                          type="number"
                          value={formData.passwordLength}
                          onChange={handleInputChange}
                          className="mt-1 bg-white"
                          placeholder="Enter password length"
                        />
                      </div>

                      <div>
                        <Label htmlFor="resetDefaultPwd" className="text-sm font-medium text-black">
                          Reset Default Password
                        </Label>
                        <Input
                          id="resetDefaultPwd"
                          name="resetDefaultPwd"
                          value={formData.resetDefaultPwd}
                          onChange={handleInputChange}
                          className="mt-1 bg-white"
                          placeholder="Enter default password"
                          type="text"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="initialPwdDays" className="text-sm font-medium text-black">
                          Initial Password Days
                        </Label>
                        <Input
                          id="initialPwdDays"
                          name="initialPwdDays"
                          type="number"
                          value={formData.initialPwdDays}
                          onChange={handleInputChange}
                          className="mt-1 bg-white"
                          placeholder="Enter initial password days"
                        />
                      </div>

                      <div>
                        <Label htmlFor="changePwdDays" className="text-sm font-medium text-black">
                          Change Password Days
                        </Label>
                        <Input
                          id="changePwdDays"
                          name="changePwdDays"
                          type="number"
                          value={formData.changePwdDays}
                          onChange={handleInputChange}
                          className="mt-1 bg-white"
                          placeholder="Enter change password days"
                        />
                      </div>

                      <div>
                        <Label htmlFor="lockUserDays" className="text-sm font-medium text-black">
                          Lock User (Disable Days)
                        </Label>
                        <Input
                          id="lockUserDays"
                          name="lockUserDays"
                          type="number"
                          value={formData.lockUserDays}
                          onChange={handleInputChange}
                          className="mt-1 bg-white"
                          placeholder="Enter lock user days"
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <Label className="text-sm font-medium text-black">
                          Proxy Settings
                        </Label>
                        <div className="mt-2 space-y-3">
                          <div>
                            <Label htmlFor="proxy1Username" className="text-xs text-black">
                              Proxy  Username
                            </Label>
                            <Input
                              id="proxy1Username"
                              name="proxy1Username"
                              value={formData.proxy1Username}
                              onChange={handleInputChange}
                              className="mt-1 bg-white"
                              placeholder="Enter proxy username"
                            />
                          </div>
                          <div>
                            <Label htmlFor="proxy1Password" className="text-xs text-black">
                              Proxy Password
                            </Label>
                            <Input
                              id="proxy1Password"
                              name="proxy1Password"
                              value={formData.proxy1Password}
                              onChange={handleInputChange}
                              className="mt-1 bg-white"
                              placeholder="Enter proxy password"
                              type="text"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          

         
        
      </div>
    </div>
  );
};

export default CompanySettings;