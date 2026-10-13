// @ts-nocheck
import { useState, useEffect } from "react";
import {
  CreditCard,
  Building,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Lock,
} from "lucide-react";
import { SERVER_URL } from "../../utils/constants";

interface PaymentForm {
  policyNo: string;
  insSurname: string;
  insFirstname: string;
  transDate: string;
  brokerName: string;
  insAddress: string;
  insMobilePhone: string;
  insEmail: string;
  startDate: string;
  amountPaid: string;
  coverType: string;
}

interface InitializePaymentRequest {
  policyNo: string;
  paymentAmount: number;
  email: string;
  customerName: string;
}

interface InitializePaymentResponse {
  success: boolean;
  message: string;
  authorization_url: string;
  reference: string;
}

const MakePayment = () => {
  const [formData, setFormData] = useState<PaymentForm>({
    policyNo: "",
    insSurname: "",
    insFirstname: "",
    transDate: new Date().toISOString().split("T")[0],
    brokerName: "",
    insAddress: "",
    insMobilePhone: "",
    insEmail: "",
    startDate: new Date().toISOString().split("T")[0],
    amountPaid: "",
    coverType: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isFetchingPolicy, setIsFetchingPolicy] = useState(false);
  const [isPolicyFetched, setIsPolicyFetched] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);

  // Auto-fill customer details from localStorage on component mount
  useEffect(() => {
    const loadCustomerDetails = () => {
      try {
        const unEncryptedUser = localStorage.getItem("unEncryptedUser");
        const token = localStorage.getItem("token");

        if (unEncryptedUser) {
          const userData = JSON.parse(unEncryptedUser);

          const customer = userData.customer || {};

          setFormData((prev) => ({
            ...prev,
            insSurname: customer.surname || customer.surName || "",
            insFirstname: customer.otherNames || customer.firstName || "",
            insEmail: customer.email || "",
            insMobilePhone: customer.mobilePhone || customer.phone || "",
            insAddress: customer.address || customer.residentialAddress || "",
          }));
        } else if (token) {
          const tokenPayload = JSON.parse(atob(token.split(".")[1]));

          setFormData((prev) => ({
            ...prev,
            insSurname: tokenPayload.SurName || "",
            insFirstname:
              tokenPayload.OtherNames || tokenPayload.FirstName || "",
            insEmail:
              tokenPayload.Email ||
              tokenPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
              ] ||
              "",
            insMobilePhone:
              tokenPayload.MobilePhone || tokenPayload.Phone || "",
          }));
        }
      } catch (error) {
        console.error("Error loading customer details:", error);
      }
    };

    loadCustomerDetails();
  }, []);

  const handleInputChange = (field: keyof PaymentForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "amountPaid") {
      setAmountTouched(true);
    }
  };

  // Fetch policy data when policy number is entered
  const fetchPolicyData = async (policyNumber: string) => {
    if (!policyNumber || policyNumber.trim() === "") {
      setIsPolicyFetched(false);
      return;
    }

    setIsFetchingPolicy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${SERVER_URL}/Getpolicies/policies/number?policyNo=${encodeURIComponent(policyNumber)}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Policy not found");
      }

      const result = await response.json();

      if (result.success && result.data) {
        const policy = result.data;

        // Auto-fill form fields from policy data
        // Only override customer fields if they're empty or if policy has different values
        setFormData((prev) => ({
          ...prev,
          policyNo: policyNumber,
          insSurname: policy.surName || prev.insSurname,
          insFirstname: policy.otherNames || prev.insFirstname,
          coverType: policy.covertype || "",
          brokerName: policy.agentDescription || "",
          insAddress: policy.address || prev.insAddress,
          insMobilePhone: policy.mobilePhone || prev.insMobilePhone,
          insEmail: policy.email || prev.insEmail,
          startDate: policy.startDate
            ? new Date(policy.startDate).toISOString().split("T")[0]
            : prev.startDate,
          transDate: policy.maturityDate
            ? new Date(policy.maturityDate).toISOString().split("T")[0]
            : prev.transDate,
          // amountPaid remains editable
        }));

        setIsPolicyFetched(true);
        setMessage("✅ Policy details loaded successfully");
      } else {
        setMessage("Policy not found. Please check the policy number.");
        setIsPolicyFetched(false);
      }
    } catch (error) {
      console.error("Error fetching policy:", error);
      setMessage("Failed to fetch policy details. Please try again.");
      setIsPolicyFetched(false);
    } finally {
      setIsFetchingPolicy(false);
    }
  };

  // Handle policy number change with debouncing
  const handlePolicyNumberChange = (value: string) => {
    setFormData((prev) => ({ ...prev, policyNo: value }));

    // Fetch policy data when user stops typing (after 500ms)
    if (value.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        fetchPolicyData(value);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setIsPolicyFetched(false);
      setMessage("");
    }
  };

  const handlePolicyLookup = async () => {
    const policyNumber = formData.policyNo?.trim();
    if (!policyNumber) return;
    await fetchPolicyData(policyNumber);
  };

  // Initialize payment using the same API as PolicyHistory
  const initializePayment = async (
    paymentData: InitializePaymentRequest,
  ): Promise<InitializePaymentResponse> => {
    try {
      setIsLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Validate payment amount
      if (!paymentData.paymentAmount || paymentData.paymentAmount <= 0) {
        throw new Error("Please enter a valid payment amount.");
      }

      console.log("Initializing payment with data:", paymentData);

      const response = await fetch(`${SERVER_URL}/Payment/initialize`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const responseText = await response.text();
      console.log("Payment API response:", responseText);

      if (!response.ok) {
        throw new Error(
          `Payment initialization failed: ${response.status} - ${responseText}`,
        );
      }

      const result: InitializePaymentResponse = JSON.parse(responseText);
      return result;
    } catch (error) {
      console.error("Error initializing payment:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    if (!formData.amountPaid || parseFloat(formData.amountPaid) <= 0) {
      setAmountTouched(true);
      setMessage("❌ Please enter a valid payment amount.");
      return;
    }

    if (parseFloat(formData.amountPaid) < 1) {
      setMessage("❌ Minimum payment amount is ₦1.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const paymentAmount = parseFloat(formData.amountPaid);
      const customerEmail = formData.insEmail;
      const customerName =
        `${formData.insFirstname} ${formData.insSurname}`.trim();

      // Validate email
      if (!customerEmail) {
        throw new Error("Customer email is required for payment.");
      }

      const paymentData: InitializePaymentRequest = {
        policyNo: formData.policyNo,
        paymentAmount: paymentAmount,
        email: customerEmail,
        customerName: customerName,
      };

      console.log("Processing payment:", paymentData);

      const paymentResponse = await initializePayment(paymentData);
      console.log("Payment initialization response:", paymentResponse);

      if (paymentResponse.authorization_url) {
        // Redirect to Paystack payment gateway
        window.location.href = paymentResponse.authorization_url;
      } else {
        throw new Error("Payment gateway not properly configured");
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Payment initialization failed";
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Make Payment
          </h1>
          <p className="text-gray-600">Submit your insurance payment</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Payment Details
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-start ${
                  message.includes("✅") ||
                  message.includes("success") ||
                  message.includes("loaded")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Policy Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                  <CreditCard size={20} />
                  Policy Information
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.policyNo}
                    onChange={(e) => handlePolicyNumberChange(e.target.value)}
                    disabled={isPolicyFetched}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter policy number"
                  />
                  {isFetchingPolicy && (
                    <p className="text-xs text-blue-600">
                      Loading policy details...
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Cover Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.coverType}
                    onChange={(e) =>
                      handleInputChange("coverType", e.target.value)
                    }
                    disabled={isPolicyFetched}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., Comprehensive, Third Party"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Amount to Pay (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    value={formData.amountPaid}
                    onChange={(e) =>
                      handleInputChange("amountPaid", e.target.value)
                    }
                    onBlur={() => setAmountTouched(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                    placeholder="0.00"
                  />
                  {amountTouched &&
                    (!formData.amountPaid ||
                      parseFloat(formData.amountPaid) <= 0) && (
                      <p className="text-sm text-red-600">
                        Please enter a valid amount
                      </p>
                    )}
                  <p className="text-xs text-gray-500">
                    Enter the amount you want to pay. Minimum amount is ₦1.
                  </p>
                </div>

                {/* Amount Preview */}
                {formData.amountPaid && parseFloat(formData.amountPaid) > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">
                        Total to pay:
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(parseFloat(formData.amountPaid))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Insured Person Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                  <User size={20} />
                  Insured Person Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Surname *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.insSurname}
                      onChange={(e) =>
                        handleInputChange("insSurname", e.target.value)
                      }
                      readOnly={isPolicyFetched}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-50 read-only:cursor-default"
                      placeholder="Surname"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Other Names *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.insFirstname}
                      onChange={(e) =>
                        handleInputChange("insFirstname", e.target.value)
                      }
                      readOnly={isPolicyFetched}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-50 read-only:cursor-default"
                      placeholder="Other names"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.insEmail}
                    onChange={(e) =>
                      handleInputChange("insEmail", e.target.value)
                    }
                    readOnly={isPolicyFetched}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-50 read-only:cursor-default"
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone size={16} />
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.insMobilePhone}
                    onChange={(e) =>
                      handleInputChange("insMobilePhone", e.target.value)
                    }
                    readOnly={isPolicyFetched}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-50 read-only:cursor-default"
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Lock
                  size={16}
                  className="text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Secure Payment</p>
                  <p className="mt-1 text-xs">
                    Your payment information is encrypted and secure. You will
                    be redirected to Paystack payment gateway to complete your
                    transaction.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={
                  isLoading ||
                  !formData.amountPaid ||
                  parseFloat(formData.amountPaid) <= 0
                }
                className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default MakePayment;
