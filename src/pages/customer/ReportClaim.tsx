// pages/customer/ReportClaim.tsx
// @ts-nocheck

import { useState } from "react";
import { AlertTriangle, Calendar, FileText, Search } from "lucide-react";
import { SERVER_URL } from "../../utils/constants";

interface ClaimForm {
  policyNo: string;
  lossNotifyDate: string;
  lossDate: string;
  lossType: string;
  lossDescription: string;
}

interface ClaimHistory {
  policyNo: string;
  lossNotifyDate: string;
  lossDate: string;
  lossType: string;
  lossDescription: string;
}

const ReportClaim = () => {
  const [formData, setFormData] = useState<ClaimForm>({
    policyNo: "",
    lossNotifyDate: new Date().toISOString().split("T")[0],
    lossDate: new Date().toISOString().split("T")[0],
    lossType: "",
    lossDescription: "",
  });

  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [searchParams, setSearchParams] = useState({
    searchText: "",
    dateFrom: "",
    dateTo: "",
    pageNo: 1,
    pageSize: 10,
  });

  const lossTypes = [
    "Accident",
    "Theft",
    "Fire",
    "Natural Disaster",
    "Vandalism",
    "Flood",
    "Liability",
    "Medical",
    "Other",
  ];

  const handleInputChange = (field: keyof ClaimForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearchChange = (field: string, value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const claimData = {
        ...formData,
        lossNotifyDate: new Date(formData.lossNotifyDate).toISOString(),
        lossDate: new Date(formData.lossDate).toISOString(),
      };

      const response = await fetch(`${SERVER_URL}/v1/Claims`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(claimData),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(
          "Claim reported successfully! Your claim has been submitted for processing."
        );
        // Reset form
        setFormData({
          policyNo: "",
          lossNotifyDate: new Date().toISOString().split("T")[0],
          lossDate: new Date().toISOString().split("T")[0],
          lossType: "",
          lossDescription: "",
        });
      } else {
        setMessage(
          "Failed to report claim. Please check your information and try again."
        );
      }
    } catch (error) {
      setMessage(
        "An error occurred. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClaimHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.searchText)
        params.append("SearchText", searchParams.searchText);
      if (searchParams.dateFrom)
        params.append(
          "DateFrom",
          new Date(searchParams.dateFrom).toISOString()
        );
      if (searchParams.dateTo)
        params.append("DateTo", new Date(searchParams.dateTo).toISOString());
      params.append("PageNo", searchParams.pageNo.toString());
      params.append("PageSize", searchParams.pageSize.toString());

      const response = await fetch(`${SERVER_URL}/v1/Claims?${params}`);

      if (response.ok) {
        const data = await response.json();
        setClaimHistory(data);
      } else {
        setMessage("Failed to fetch claim history.");
      }
    } catch (error) {
      setMessage("Error fetching claim history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Report a Claim
          </h1>
          <p className="text-gray-600">
            Submit a new insurance claim or view claim history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Report New Claim Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-600" />
                Report New Claim
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {message && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    message.includes("success")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.policyNo}
                    onChange={(e) =>
                      handleInputChange("policyNo", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your policy number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar size={16} />
                      Loss Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.lossDate}
                      onChange={(e) =>
                        handleInputChange("lossDate", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar size={16} />
                      Notification Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.lossNotifyDate}
                      onChange={(e) =>
                        handleInputChange("lossNotifyDate", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Loss Type *
                  </label>
                  <select
                    required
                    value={formData.lossType}
                    onChange={(e) =>
                      handleInputChange("lossType", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select loss type</option>
                    {lossTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText size={16} />
                    Loss Description *
                  </label>
                  <textarea
                    required
                    value={formData.lossDescription}
                    onChange={(e) =>
                      handleInputChange("lossDescription", e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide a detailed description of the loss or incident..."
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={18} />
                  {isLoading ? "Reporting Claim..." : "Report Claim"}
                </button>
              </div>
            </form>
          </div>

          {/* Claim History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Search size={20} className="text-blue-600" />
                Claim History
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Search
                    </label>
                    <input
                      type="text"
                      value={searchParams.searchText}
                      onChange={(e) =>
                        handleSearchChange("searchText", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Policy number or description"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={searchParams.dateFrom}
                      onChange={(e) =>
                        handleSearchChange("dateFrom", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={searchParams.dateTo}
                      onChange={(e) =>
                        handleSearchChange("dateTo", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={fetchClaimHistory}
                      disabled={isLoadingHistory}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Search size={16} />
                      {isLoadingHistory ? "Searching..." : "Search Claims"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {isLoadingHistory ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading claim history...
                  </div>
                ) : claimHistory.length > 0 ? (
                  claimHistory.map((claim, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {claim.policyNo}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {claim.lossType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {claim.lossDescription}
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Loss: {formatDate(claim.lossDate)}</span>
                        <span>
                          Reported: {formatDate(claim.lossNotifyDate)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No claim history found. Use the search filters above to find
                    claims.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ReportClaim;
