// @ts-nocheck

import { useState, useEffect } from "react";
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Search,
  Eye,
  Download,
  Phone,
  Shield,
  CreditCard,
  ExternalLink,
  Lock,
  Menu,
  X,
} from "lucide-react";
import { SERVER_URL } from "../../utils/constants";

interface Policy {
  id: string;
  policyNo: string;
  policyName: string;
  insuredName: string;
  startDate: string;
  endDate: string;
  premiumAmount: number;
  status: "active" | "expired" | "pending" | "cancelled";
  productCode: string;
  productName: string;
  paymentStatus: "paid" | "unpaid" | "partial";
  nextDueDate?: string;
  insuredId: string;
}

// Add this interface for policy details// Enhanced PolicyDetails interface
interface PolicyDetails extends Policy {
  // Basic policy info from API
  policyID: number;
  proposalNo: string;
  brCode: string;
  tDate: string;
  propDate: string;
  assDate: string;
  coverCode: string;
  covertype: string;
  title: string;
  assuredCode: string;
  surName: string;
  otherNames: string;
  fullName: string | null;
  address: string;
  state: string;
  landphone: string;
  mobilePhone: string;
  email: string;
  nationalID: string;
  occupation: string;
  sex: string;
  maritalStatus: string;
  country: string | null;
  agentcode: string;
  agentDescription: string;
  duration: number;
  dateofBirth: string;
  fop: string;
  age: number;
  mop: string;
  sumAssured: number;
  premium1: number | null;
  premium2: number | null;
  premium3: number | null;
  basicPremium: number;
  intrestRate: number | null;
  totalPremium: number;
  loading: number;
  suppsa: number | null;
  xMas: number;
  adbsa: number | null;
  toAllocate: number | null;
  paymentType: string | null;
  paymentAmount: number | null;
  dateofpayment: string | null;
  receiptNo: string | null;
  bankName: string | null;
  accountNo: string | null;
  transSTATUS: string | null;
  transGUID: string | null;
  remarks: string;
  tag: string;
  contactName: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string | null;
  contactJob: string;
  customerType: string;
  meansID: string;
  idNo: string;
  chronicIllness: string;
  isProposal: number;
  deleted: number;
  submittedBy: string;
  submittedOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
  
  // Additional calculated fields
  policyTerm?: string;
  paymentFrequency?: string;
  beneficiaries?: Array<{
    name: string;
    relationship: string;
    percentage: number;
  }>;
  riders?: string[];
  documents?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  // Raw data for reference
  rawData?: any;
}

// Payment interfaces
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

interface ApiResponse {
  success: boolean;
  data: Policy[];
  count?: number;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

interface CustomerData {
  id: string;
  insuredID: string;
  fullName: string;
  surname: string;
  otherNames: string;
  email: string;
  mobilePhone: string;
  clientType: string | null;
  dateOfBirth: string;
  isActive: number;
  permissions: string[];
}

interface UserData {
  customer: CustomerData;
}

interface AgentData {
  id: string;
  agentCode: string;
  fullName: string;
  email: string;
  mobilePhone: string;
  isActive: number;
  permissions: string[];
}

// ✅ ADD THIS: Interface for component props
interface PolicyHistoryProps {
  compact?: boolean;
  isAgentView?: boolean;
}

// ✅ UPDATE THIS: Add props to component
const PolicyHistory: React.FC<PolicyHistoryProps> = ({ compact = false, isAgentView = false }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [userType, setUserType] = useState<"customer" | "agent">("customer");
  const [isMobile, setIsMobile] = useState(false);
  const [fullPolicyData, setFullPolicyData] = useState<any[]>([]);
const [allPolicies, setAllPolicies] = useState<any[]>([]);

  // Add this state for details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPolicyDetails, setSelectedPolicyDetails] =
    useState<PolicyDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Payment states
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [userPaymentAmount, setUserPaymentAmount] = useState<number>(0);
  const [amountTouched, setAmountTouched] = useState(false);
  

  // Payment method selection state
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  // Check mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Get user data from localStorage with better error handling
  useEffect(() => {
    const loadUserData = () => {
      try {
     

        // Method 1: Try to get from unEncryptedUser
        const unEncryptedUser = localStorage.getItem("unEncryptedUser");


        if (unEncryptedUser) {
          try {
            const userData = JSON.parse(unEncryptedUser);
           

            // Check for customer data in different possible structures
            if (
              userData.customer &&
              userData.customer.insuredID &&
              userData.customer.insuredID !== "N/A"
            ) {
              setCustomerData(userData.customer);
              setUserType("customer");
              return;
            } else if (userData.insuredID && userData.insuredID !== "N/A") {
              setCustomerData(userData);
              setUserType("customer");
              return;
            } else {
              console.warn(
                "Invalid customer data in unEncryptedUser:",
                userData
              );
            }
          } catch (parseError) {
            console.warn("Error parsing unEncryptedUser:", parseError);
          }
        }

        // Method 2: Try to get from token (based on your actual token structure)
        const token = localStorage.getItem("token");

        if (token) {
          try {
            const tokenPayload = JSON.parse(atob(token.split(".")[1]));
            // Extract data based on YOUR ACTUAL token structure from the logs
            const userType = tokenPayload.UserType; // "Agent" from your logs
            const agentId = tokenPayload.AgentID; // "410071007" from your logs
            const nameIdentifier =
              tokenPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
              ]; // "6828" from your logs
            const name =
              tokenPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
              ]; // "410071007" from your logs
            const email =
              tokenPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
              ]; // "pellumi67@gmail.com" from your logs

            console.log("Extracted token data:", {
              userType,
              agentId,
              nameIdentifier,
              name,
              email,
            });

            if (userType === "Agent" && agentId) {
              // User is an agent (based on your actual token data)
              const agentFromToken = {
                id: nameIdentifier || agentId,
                agentCode: agentId, // Using AgentID as agentCode
                fullName: tokenPayload.AgentName || name || "Agent",
                email: email || "",
                mobilePhone: tokenPayload.mobilePhone || "",
                isActive: 1,
                permissions: tokenPayload.Permission || [
                  "ViewPolicies",
                  "CreateData",
                  "ViewCommissions",
                ],
                unitID: tokenPayload.UnitID || null,
              };

              console.log("Setting agent data from token:", agentFromToken);
              setAgentData(agentFromToken);
              setUserType("agent");
              return;
            } else if (
              nameIdentifier &&
              nameIdentifier !== "N/A" &&
              userType !== "Agent"
            ) {
              // User might be a customer
              const customerFromToken = {
                id: nameIdentifier,
                insuredID: nameIdentifier,
                fullName: name || "Customer",
                surname: tokenPayload.surname || "",
                otherNames: tokenPayload.otherNames || "",
                email: email || "",
                mobilePhone: tokenPayload.mobilePhone || "",
                clientType: null,
                dateOfBirth: tokenPayload.dateOfBirth || "",
                isActive: 1,
                permissions: tokenPayload.Permission || [
                  "ViewOwnPolicies",
                  "ViewOwnProfile",
                ],
              };

              console.log(
                "Setting customer data from token:",
                customerFromToken
              );
              setCustomerData(customerFromToken);
              setUserType("customer");
              return;
            } else {
              console. warn("No valid user identification found in token");
              console.warn(
                "Available token fields:",
                Object.keys(tokenPayload)
              );
            }
          } catch (tokenError) {
            console.error("Error decoding token:", tokenError);
          }
        }

        // Method 3: Try encrypted token as last resort
        const encryptedToken = localStorage.getItem("encryptedToken");
        if (encryptedToken && !token) {
          console.log("Found encrypted token, attempting decryption...");
          // Add your decryption logic here if needed
        }

        // If no valid data found
        console.error("No valid user data found in localStorage");
        setError("Unable to load user information. Please log in again.");
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load user information.");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Get user ID based on user type
  const selectedInsuredId = customerData?.insuredID;
  const selectedAgentCode = agentData?.agentCode;
  const encodedInsuredId = selectedInsuredId
    ? encodeURIComponent(selectedInsuredId)
    : "";
  const encodedAgentCode = selectedAgentCode
    ? encodeURIComponent(selectedAgentCode)
    : "";

  useEffect(() => {
    if (
      (userType === "customer" &&
        selectedInsuredId &&
        selectedInsuredId !== "N/A") ||
      (userType === "agent" && selectedAgentCode)
    ) {
      fetchPolicies();
    } else if (customerData !== null || agentData !== null) {
      // User data loaded but no valid ID found
      setError(
        `No valid ${userType} ID found in your profile. Please contact support.`
      );
      setLoading(false);
    }
  }, [selectedInsuredId, selectedAgentCode, userType, customerData, agentData]);



  const fetchPolicies = async () => {
    if (userType === "customer") {
      if (!selectedInsuredId || selectedInsuredId === "N/A") {
        setError(
          "No valid insured ID found. Please make sure you are logged in."
        );
        setLoading(false);
        return;
      }
      await fetchCustomerPolicies();
    } else if (userType === "agent") {
      if (!selectedAgentCode) {
        setError(
          "No valid agent code found. Please make sure you are logged in."
        );
        setLoading(false);
        return;
      }
      await fetchAgentPolicies();
    }
  };




  const fetchCustomerPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // ✅ CORRECT URL: Use query parameter instead of path parameter
      const url = `${SERVER_URL}/Getpolicies/policies/insured?insuredId=${encodedInsuredId}`;
      
      console.log("Fetching customer policies for insured ID:", selectedInsuredId);
      console.log("API URL:", url);
  
      const response = await fetch(
        url, // ✅ Fixed URL
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("API Response status:", response.status);
  
      if (!response.ok) {
        if (response.status === 404) {
          console.log("Primary endpoint returned 404, trying search endpoint...");
          // Try the search endpoint as fallback
          await trySearchEndpoint();
          return;
        } else if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        } else {
          throw new Error(
            `Failed to fetch policies: ${response.status} ${response.statusText}`
          );
        }
      }
  
      const result: ApiResponse = await response.json();
      
      // Safe logging - remove sensitive data
      if (process.env.NODE_ENV !== 'production') {
        console.log("API Response data (safe):", {
          success: result.success,
          count: result.count,
          dataCount: result.data?.length || 0
        });
      }
  
      if (result.success) {
        if (result.data && result.data.length > 0) {
          // ✅ Store the full API data for details view
          setFullPolicyData(result.data);
          
          const transformedPolicies = result.data.map(
            (policy: any, index: number) => ({
              id: policy.policyID || policy.policyNo || `policy-${index}-${Date.now()}`,
              policyNo: policy.policyNo || `POL-${index + 1}`,
              policyName: policy.covertype || policy.productName || `Policy ${index + 1}`,
              insuredName: policy.fullName || `${policy.surName} ${policy.otherNames}`.trim() || "You",
              startDate: policy.startDate || new Date().toISOString(),
              endDate: policy.maturityDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              premiumAmount: policy.basicPremium || policy.premium1 || policy.totalPremium || 0,
              status: mapStatus(policy.status || policy.remarks || "PENDING"),
              productCode: policy.coverCode || "UNKNOWN",
              productName: policy.covertype || "Unknown Product",
              paymentStatus: mapPaymentStatus(policy.paymentType || "unpaid"),
              nextDueDate: policy.nextDueDate,
              insuredId: policy.assuredCode || selectedInsuredId,
              // Store the raw data for details view
              rawData: policy
            })
          );
  
          setPolicies(transformedPolicies);
        } else {
          setPolicies([]);
          setError("No policies found for your account.");
        }
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      console.error("Error fetching customer policies:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load policies from API";
      setError(errorMessage);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };



  const fetchAgentPolicies = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching agent policies for agent code:", selectedAgentCode);
      console.log("Encoded agent code for API:", encodedAgentCode);

      const response = await fetch(
        `${SERVER_URL}/Getpolicies/policies/agent?agentCode=${encodedAgentCode}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          setPolicies([]);
          setError("No policies found for your agent code.");
          return;
        } else if (response.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        } else {
          throw new Error(
            `Failed to fetch policies: ${response.status} ${response.statusText}`
          );
        }
      }

      const result: ApiResponse = await response.json();
      console.log("API Response data:", result);

      if (result.success) {
        if (result.data && result.data.length > 0) {
          const transformedPolicies = result.data.map(
            (policy: any, index: number) => ({
              id:
                policy.policyNo || policy.id || `policy-${index}-${Date.now()}`,
              policyNo: policy.policyNo || `POL-${index + 1}`,
              policyName:
                policy.policyName ||
                policy.productName ||
                `Policy ${index + 1}`,
              insuredName: policy.insuredName || "Customer",
              startDate:
                policy.startDate ||
                policy.effectiveDate ||
                new Date().toISOString(),
              endDate:
                policy.endDate ||
                policy.expiryDate ||
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              premiumAmount: policy.premiumAmount || policy.premium || 0,
              status: mapStatus(policy.status),
              productCode: policy.productCode || "UNKNOWN",
              productName: policy.productName || "Unknown Product",
              paymentStatus: mapPaymentStatus(policy.paymentStatus),
              nextDueDate: policy.nextDueDate,
              insuredId: policy.insuredId || "N/A",
            })
          );

          setPolicies(transformedPolicies);
        } else {
          setPolicies([]);
          setError("No policies found for your agent code.");
        }
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      console.error("Error fetching agent policies:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load policies from API";
      setError(errorMessage);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const trySearchEndpoint = async () => {
    try {
      console.log("Trying search endpoint as fallback...");

      const response = await fetch(
        `${SERVER_URL}/Getpolicies/policies/search?insuredId=${encodedInsuredId}&page=1&pageSize=50`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search endpoint also failed: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      console.log("Search endpoint response:", result);

      if (result.success && result.data && result.data.length > 0) {
        const transformedPolicies = result.data.map(
          (policy: any, index: number) => ({
            id: policy.policyNo || policy.id || `policy-${index}-${Date.now()}`,
            policyNo: policy.policyNo || `POL-${index + 1}`,
            policyName:
              policy.policyName || policy.productName || `Policy ${index + 1}`,
            insuredName: policy.insuredName || customerData?.fullName || "You",
            startDate:
              policy.startDate ||
              policy.effectiveDate ||
              new Date().toISOString(),
            endDate:
              policy.endDate ||
              policy.expiryDate ||
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            premiumAmount: policy.premiumAmount || policy.premium || 0,
            status: mapStatus(policy.status),
            productCode: policy.productCode || "UNKNOWN",
            productName: policy.productName || "Unknown Product",
            paymentStatus: mapPaymentStatus(policy.paymentStatus),
            nextDueDate: policy.nextDueDate,
            insuredId: policy.insuredId || selectedInsuredId,
          })
        );

        setPolicies(transformedPolicies);
        setError(null);
      } else {
        setPolicies([]);
        setError("No policies found for your account in our system.");
      }
    } catch (searchError) {
      console.error("Search endpoint also failed:", searchError);
      setPolicies([]);
      setError(
        "No policies found for your account. This account may not have any active policies."
      );
    }
  };

  // Payment functions
  const initializePayment = async (
    paymentData: InitializePaymentRequest
  ): Promise<InitializePaymentResponse> => {
    try {
      setPaymentLoading(true);
      setPaymentError(null);

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
          `Payment initialization failed: ${response.status} - ${responseText}`
        );
      }

      const result: InitializePaymentResponse = JSON.parse(responseText);
      return result;
    } catch (error) {
      console.error("Error initializing payment:", error);
      throw error;
    } finally {
      setPaymentLoading(false);
    }
  };

  // Main payment handler
  const handlePayment = async () => {
    if (!selectedPolicy) return;

    try {
      // For agents, they might be paying on behalf of customers
      let customerEmail = customerData?.email;
      let customerName = customerData?.fullName || selectedPolicy.insuredName;

      // If user is agent, use agent's email as fallback
      if (userType === "agent") {
        customerEmail = agentData?.email || customerData?.email;
        customerName =
          selectedPolicy.insuredName || agentData?.fullName || "Customer";

        if (!customerEmail) {
          throw new Error(
            "Please update your agent profile with an email address."
          );
        }
      } else {
        // For customers, validate their own email
        if (!customerData?.email) {
          throw new Error(
            "Customer email not found. Please update your profile."
          );
        }
      }

      // Validate user input
      if (!userPaymentAmount || userPaymentAmount <= 0) {
        setAmountTouched(true);
        throw new Error("Please enter a valid payment amount.");
      }

      if (userPaymentAmount < 1) {
        throw new Error("Minimum payment amount is ₦1.");
      }

      const paymentData: InitializePaymentRequest = {
        policyNo: selectedPolicy.policyNo,
        paymentAmount: userPaymentAmount,
        email: customerEmail,
        customerName: customerName,
      };

      console.log("Processing payment with user input:", paymentData);

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
      setPaymentError(errorMessage);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    if (method === "paystack") {
      // Directly proceed with Paystack payment
      handlePayment();
    } else {
      // For other methods, show appropriate message
      alert(
        `${
          method.charAt(0).toUpperCase() + method.slice(1)
        } payment integration coming soon!`
      );
    }
  };

  // Open payment method modal
  const handleOpenPaymentMethodModal = (policy: Policy) => {
    setSelectedPolicy(policy);
    setUserPaymentAmount(policy.premiumAmount > 0 ? policy.premiumAmount : 0);
    setAmountTouched(false);
    setPaymentError(null);
    setPaymentSuccess(false);
    setShowPaymentMethodModal(true);
  };

  // Add this function to handle viewing details
 // Replace your current handleViewDetails function (around line 423) with this:

const handleViewDetails = async (policy: Policy) => {
  setSelectedPolicyDetails(null);
  setShowDetailsModal(true);
  setDetailsLoading(true);

  try {
    // Find the full policy data from your stored array
    const fullPolicy = fullPolicyData.find(p => 
      p.policyNo === policy.policyNo || 
      p.policyID?.toString() === policy.id
    );

    if (!fullPolicy) {
      // Fallback to basic policy info
      setSelectedPolicyDetails(policy as PolicyDetails);
      setDetailsLoading(false);
      return;
    }

    // Calculate additional information
    const maturityDate = fullPolicy.maturityDate ? new Date(fullPolicy.maturityDate) : null;
    const startDate = fullPolicy.startDate ? new Date(fullPolicy.startDate) : null;
    const today = new Date();
    
    let policyTerm = "";
    if (startDate && maturityDate) {
      const yearsDiff = maturityDate.getFullYear() - startDate.getFullYear();
      const monthsDiff = maturityDate.getMonth() - startDate.getMonth();
      const totalMonths = yearsDiff * 12 + monthsDiff;
      policyTerm = `${totalMonths} months (${Math.floor(totalMonths/12)} years)`;
    }

    // Create enhanced policy details
    const enhancedPolicy: PolicyDetails = {
      ...policy,
      // Map all API fields
      policyID: fullPolicy.policyID,
      proposalNo: fullPolicy.proposalNo,
      brCode: fullPolicy.brCode,
      tDate: fullPolicy.tDate,
      propDate: fullPolicy.propDate,
      assDate: fullPolicy.assDate,
      coverCode: fullPolicy.coverCode,
      covertype: fullPolicy.covertype,
      title: fullPolicy.title,
      assuredCode: fullPolicy.assuredCode,
      surName: fullPolicy.surName,
      otherNames: fullPolicy.otherNames,
      fullName: fullPolicy.fullName,
      address: fullPolicy.address,
      state: fullPolicy.state,
      landphone: fullPolicy.landphone,
      mobilePhone: fullPolicy.mobilePhone,
      email: fullPolicy.email,
      nationalID: fullPolicy.nationalID,
      occupation: fullPolicy.occupation,
      sex: fullPolicy.sex,
      maritalStatus: fullPolicy.maritalStatus,
      country: fullPolicy.country,
      agentcode: fullPolicy.agentcode,
      agentDescription: fullPolicy.agentDescription,
      duration: fullPolicy.duration,
      dateofBirth: fullPolicy.dateofBirth,
      fop: fullPolicy.fop,
      age: fullPolicy.age,
      mop: fullPolicy.mop,
      sumAssured: fullPolicy.sumAssured,
      premium1: fullPolicy.premium1,
      premium2: fullPolicy.premium2,
      premium3: fullPolicy.premium3,
      basicPremium: fullPolicy.basicPremium,
      intrestRate: fullPolicy.intrestRate,
      totalPremium: fullPolicy.totalPremium,
      loading: fullPolicy.loading,
      suppsa: fullPolicy.suppsa,
      xMas: fullPolicy.xMas,
      adbsa: fullPolicy.adbsa,
      toAllocate: fullPolicy.toAllocate,
      paymentType: fullPolicy.paymentType,
      paymentAmount: fullPolicy.paymentAmount,
      dateofpayment: fullPolicy.dateofpayment,
      receiptNo: fullPolicy.receiptNo,
      bankName: fullPolicy.bankName,
      accountNo: fullPolicy.accountNo,
      transSTATUS: fullPolicy.transSTATUS,
      transGUID: fullPolicy.transGUID,
      remarks: fullPolicy.remarks,
      tag: fullPolicy.tag,
      contactName: fullPolicy.contactName,
      contactAddress: fullPolicy.contactAddress,
      contactPhone: fullPolicy.contactPhone,
      contactEmail: fullPolicy.contactEmail,
      contactJob: fullPolicy.contactJob,
      customerType: fullPolicy.customerType,
      meansID: fullPolicy.meansID,
      idNo: fullPolicy.idNo,
      chronicIllness: fullPolicy.chronicIllness,
      isProposal: fullPolicy.isProposal,
      deleted: fullPolicy.deleted,
      submittedBy: fullPolicy.submittedBy,
      submittedOn: fullPolicy.submittedOn,
      modifiedBy: fullPolicy.modifiedBy,
      modifiedOn: fullPolicy.modifiedOn,
      
      // Additional calculated fields
      policyTerm: policyTerm,
      paymentFrequency: fullPolicy.fop || "Not specified",
      
      // Simulated beneficiaries
      beneficiaries: [
        { 
          name: fullPolicy.surName || "Primary Beneficiary", 
          relationship: "Self", 
          percentage: 100 
        }
      ],
      
      // Simulated riders
      riders: fullPolicy.covertype ? [fullPolicy.covertype] : ["Basic Coverage"],
      
      // Simulated documents
      documents: [
        { name: "Policy Document", type: "PDF", url: "#" },
        { name: "Terms and Conditions", type: "PDF", url: "#" },
        { name: "Payment Receipt", type: "PDF", url: "#" },
      ],
      
      // Store raw data
      rawData: fullPolicy
    };

    setSelectedPolicyDetails(enhancedPolicy);
  } catch (error) {
    console.error("Error loading policy details:", error);
    // Fallback to basic policy info
    setSelectedPolicyDetails(policy as PolicyDetails);
  } finally {
    setDetailsLoading(false);
  }
};

  // Add this function to handle document downloads
  const handleDownloadDocument = (
    documentName: string,
    documentUrl: string
  ) => {
    console.log(`Downloading ${documentName} from ${documentUrl}`);
    alert(`Download feature for ${documentName} will be available soon!`);
  };

  // Add this function to contact support
  const handleContactSupport = () => {
    const phoneNumber = "+2348000000000";
    const email = "support@gibsonlife.com";

    const message = `Contact MICROLIFE Support:\nPhone: ${phoneNumber}\nEmail: ${email}`;
    alert(message);
  };

  // Helper functions
  const mapStatus = (status: string): Policy["status"] => {
    if (!status) return "pending";

    const statusMap: { [key: string]: Policy["status"] } = {
      ACTIVE: "active",
      EXPIRED: "expired",
      PENDING: "pending",
      CANCELLED: "cancelled",
      LAPSED: "expired",
      INFORCE: "active",
      SURRENDERED: "cancelled",
      active: "active",
      expired: "expired",
      pending: "pending",
      cancelled: "cancelled",
    };
    return statusMap[status.toUpperCase()] || "pending";
  };

  const mapPaymentStatus = (paymentStatus: string): Policy["paymentStatus"] => {
    if (!paymentStatus) return "unpaid";

    const paymentMap: { [key: string]: Policy["paymentStatus"] } = {
      PAID: "paid",
      UNPAID: "unpaid",
      PARTIAL: "partial",
      OVERDUE: "unpaid",
      DUE: "unpaid",
      paid: "paid",
      unpaid: "unpaid",
      partial: "partial",
    };
    return paymentMap[paymentStatus.toUpperCase()] || "unpaid";
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      if (
        userType === "customer" &&
        selectedInsuredId &&
        selectedInsuredId !== "N/A"
      ) {
        searchPolicies({
          insuredId: encodedInsuredId,
          policyNo: searchTerm,
          page: 1,
          pageSize: 10,
        });
      } else if (userType === "agent" && selectedAgentCode) {
        searchPolicies({
          agentCode: encodedAgentCode,
          policyNo: searchTerm,
          page: 1,
          pageSize: 10,
        });
      } else {
        fetchPolicies();
      }
    } else {
      fetchPolicies();
    }
  };

  const searchPolicies = async (filters: {
    agentCode?: string;
    insuredId?: string;
    policyNo?: string;
    surname?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${SERVER_URL}/Getpolicies/policies/search?${params}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`
        );
      }

      const result: ApiResponse = await response.json();

      if (result.success) {
        if (result.data && result.data.length > 0) {
          const transformedPolicies = result.data.map(
            (policy: any, index: number) => ({
              id:
                policy.policyNo || policy.id || `policy-${index}-${Date.now()}`,
              policyNo: policy.policyNo || `POL-${index + 1}`,
              policyName:
                policy.policyName ||
                policy.productName ||
                `Policy ${index + 1}`,
              insuredName:
                policy.insuredName ||
                (userType === "customer"
                  ? customerData?.fullName
                  : "Customer") ||
                "You",
              startDate:
                policy.startDate ||
                policy.effectiveDate ||
                new Date().toISOString(),
              endDate:
                policy.endDate ||
                policy.expiryDate ||
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              premiumAmount: policy.premiumAmount || policy.premium || 0,
              status: mapStatus(policy.status),
              productCode: policy.productCode || "UNKNOWN",
              productName: policy.productName || "Unknown Product",
              paymentStatus: mapPaymentStatus(policy.paymentStatus),
              nextDueDate: policy.nextDueDate,
              insuredId:
                policy.insuredId ||
                (userType === "customer" ? selectedInsuredId : "N/A"),
            })
          );

          setPolicies(transformedPolicies);
        } else {
          setPolicies([]);
          setError("No policies found matching your search criteria");
        }
      } else {
        throw new Error("Search returned unsuccessful response");
      }
    } catch (err) {
      console.error("Error searching policies:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getStatusColor = (status: Policy["status"]) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "expired":
        return "text-red-600 bg-red-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPaymentStatusColor = (status: Policy["paymentStatus"]) => {
    switch (status) {
      case "paid":
        return "text-green-600 bg-green-100";
      case "partial":
        return "text-blue-600 bg-blue-100";
      case "unpaid":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Mobile-friendly policy card component
  const PolicyCard = ({ policy }: { policy: Policy }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {policy.policyName}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-1">
              {policy.policyNo}
            </p>
            {userType === "agent" && (
              <p className="text-xs text-blue-600 mt-1">
                Insured: {policy.insuredName}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              policy.status
            )}`}
          >
            {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500 text-xs">Start Date</p>
          <p className="font-medium text-xs">{formatDate(policy.startDate)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">End Date</p>
          <p className="font-medium text-xs">{formatDate(policy.endDate)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Premium</p>
          <p className="font-medium text-xs">
            {policy.premiumAmount > 0
              ? formatCurrency(policy.premiumAmount)
              : "Not specified"}
          </p>
        </div>
       
      </div>

      <div className="flex space-x-2 pt-2 border-t border-gray-100">
        {((userType === "customer" && policy.paymentStatus === "unpaid") ||
          (userType === "agent" && policy.paymentStatus === "unpaid")) && (
          <button
            onClick={() => handleOpenPaymentMethodModal(policy)}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium text-center"
          >
            Pay Now
          </button>
        )}
        <button
          onClick={() => handleViewDetails(policy)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center justify-center"
        >
          <Eye size={12} className="mr-1" />
          Details
        </button>
      </div>
    </div>
  );

  // Show loading state while fetching user data
  if (loading && !customerData && !agentData) {
    return (
      // ✅ UPDATE THIS: Wrap loading state with same structure
      <div className={isAgentView ? "max-w-5xl mx-auto" : ""}>
        <main className={`flex-1 ${compact ? 'p-0' : 'p-4 lg:p-6 xl:p-8'}`}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              Loading your information...
            </span>
          </div>
        </main>
      </div>
    );
  }

  // ✅ UPDATE THIS: The entire return statement structure
  return (
    <div className={isAgentView ? "max-w-5xl mx-auto" : ""}>
      <main className={`flex-1 ${compact ? 'p-0' : 'p-4 lg:p-6 xl:p-8'}`}>
        
        {/* ✅ UPDATE THIS: Conditionally show header */}
        {!compact && (
          <div className="mb-6">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-2">
              {userType === "agent"
                ? "Agent Policy Management"
                : "My Policy History"}
            </h1>
            <p className="text-gray-600 text-sm lg:text-base">
              {userType === "agent"
                ? "View and manage policies under your agency"
                : "View and manage your insurance policies"}
            </p>
          </div>
        )}

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
          <div className="space-y-4 lg:space-y-0 lg:flex lg:items-end lg:justify-between lg:space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search {userType === "agent" ? "Agency" : "My"} Policies
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search by policy number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
                  disabled={
                    (userType === "customer" &&
                      (!selectedInsuredId || selectedInsuredId === "N/A")) ||
                    (userType === "agent" && !selectedAgentCode)
                  }
                />
                <button
                  onClick={handleSearch}
                  disabled={
                    (userType === "customer" &&
                      (!selectedInsuredId || selectedInsuredId === "N/A")) ||
                    (userType === "agent" && !selectedAgentCode)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 text-sm lg:text-base"
                >
                  {isMobile ? <Search size={16} /> : "Search"}
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={fetchPolicies}
                disabled={
                  (userType === "customer" &&
                    (!selectedInsuredId || selectedInsuredId === "N/A")) ||
                  (userType === "agent" && !selectedAgentCode)
                }
                className="flex-1 lg:flex-none px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm lg:text-base"
              >
                {isMobile ? "Refresh" : "Refresh Policies"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-red-600 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
              <button
                onClick={fetchPolicies}
                className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600 mt-4">
            <User size={16} className="mr-2 flex-shrink-0" />
            <span className="truncate">
              Welcome back,{" "}
              <strong className="text-gray-800">
                {userType === "agent"
                  ? agentData?.fullName
                  : customerData?.fullName || "User"}
              </strong>
              {userType === "customer" &&
                selectedInsuredId &&
                selectedInsuredId !== "N/A" && (
                  <>
                    <span className="mx-2 hidden sm:inline">•</span>
                    <span className="text-gray-500 hidden sm:inline">
                      Customer ID: {selectedInsuredId}
                    </span>
                  </>
                )}
              {userType === "agent" && selectedAgentCode && (
                <>
                  <span className="mx-2 hidden sm:inline">•</span>
                  <span className="text-gray-500 hidden sm:inline">
                    Agent Code: {selectedAgentCode}
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Mobile-only user info */}
          {(userType === "customer" &&
            selectedInsuredId &&
            selectedInsuredId !== "N/A") ||
            (userType === "agent" && selectedAgentCode && (
              <div className="sm:hidden text-xs text-gray-500 mt-2">
                {userType === "customer"
                  ? `Customer ID: ${selectedInsuredId}`
                  : `Agent Code: ${selectedAgentCode}`}
              </div>
            ))}

          {userType === "customer" &&
            (!selectedInsuredId || selectedInsuredId === "N/A") && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle size={16} className="text-yellow-600 mr-2" />
                  <span className="text-yellow-700 text-sm">
                    Unable to load your insured ID. Please make sure you are
                    logged in correctly.
                  </span>
                </div>
              </div>
            )}

          {userType === "agent" && !selectedAgentCode && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle size={16} className="text-yellow-600 mr-2" />
                <span className="text-yellow-700 text-sm">
                  Unable to load your agent code. Please make sure you are logged
                  in correctly.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State for Policies */}
        {loading && (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading policies...</span>
          </div>
        )}

        {/* Policies Display */}
        {!loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {userType === "agent" ? "Agency Policies" : "My Policies"}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar size={16} />
                  <span>{policies.length} policies</span>
                </div>
              </div>
            </div>

            {/* Policies Content */}
            {policies.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No policies found
                </h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto text-sm">
                  {error
                    ? error
                    : `We couldn't find any policies ${
                        userType === "agent"
                          ? "under your agency"
                          : "associated with your account"
                      }.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={fetchPolicies}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Refresh Policies
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="md:hidden p-4">
                  {policies.map((policy) => (
                    <PolicyCard key={policy.id} policy={policy} />
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Policy Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coverage Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Premium
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {policies.map((policy) => (
                        <tr
                          key={policy.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FileText size={18} className="text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {policy.policyName}
                                </div>
                                <div className="text-sm text-gray-500 font-mono">
                                  {policy.policyNo}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {policy.productName}
                                </div>
                                {userType === "agent" && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    Insured: {policy.insuredName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(policy.startDate)}
                            </div>
                            <div className="text-sm text-gray-500">
                              to {formatDate(policy.endDate)}
                            </div>
                            {policy.nextDueDate && (
                              <div className="text-xs text-blue-600 flex items-center mt-1">
                                <Clock size={12} className="mr-1" />
                                Renews {formatDate(policy.nextDueDate)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {policy.premiumAmount > 0
                              ? formatCurrency(policy.premiumAmount)
                              : "Not specified"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                policy.status
                              )}`}
                            >
                              {policy.status.charAt(0).toUpperCase() +
                                policy.status.slice(1)}
                            </span>
                          </td>
                         
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {((userType === "customer" &&
                                policy.paymentStatus === "unpaid") ||
                                (userType === "agent" &&
                                  policy.paymentStatus === "unpaid")) && (
                                <button
                                  onClick={() =>
                                    handleOpenPaymentMethodModal(policy)
                                  }
                                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                                >
                                  {userType === "agent" ? "Pay Now" : "Pay Now"}
                                </button>
                              )}
                              <button
                                onClick={() => handleViewDetails(policy)}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium flex items-center"
                              >
                                <Eye size={12} className="mr-1" />
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Footer */}
            {policies.length > 0 && (
              <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                  <p className="text-sm text-gray-600">
                    Showing {policies.length} polic
                    {policies.length !== 1 ? "ies" : "y"}
                  </p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Back to Top
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Method Selection Modal */}
        {showPaymentMethodModal && selectedPolicy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Make Payment for {selectedPolicy.policyName}
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Policy Number:</span>
                    <span className="font-medium">{selectedPolicy.policyNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Name:</span>
                    <span className="font-medium">
                      {selectedPolicy.insuredName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {userType === "agent"
                        ? agentData?.email
                        : customerData?.email || "Not available"}
                    </span>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Enter Payment Amount (₦) *
                    </label>
                    <input
                      type="number"
                      value={userPaymentAmount || ""}
                      onChange={(e) => {
                        setUserPaymentAmount(Number(e.target.value));
                        setAmountTouched(true);
                      }}
                      onBlur={() => setAmountTouched(true)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                      min="1"
                      step="0.01"
                    />
                    {amountTouched &&
                      (!userPaymentAmount || userPaymentAmount <= 0) && (
                        <p className="text-red-600 text-sm">
                          Please enter a valid amount
                        </p>
                      )}
                    <p className="text-xs text-gray-500">
                      Enter the amount you want to pay. Minimum amount is ₦1.
                    </p>
                  </div>

                  {/* Amount Preview */}
                  {userPaymentAmount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">
                          Total to pay:
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(userPaymentAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <AlertCircle size={16} className="text-red-600 mr-2" />
                      <span className="text-sm text-red-700">{paymentError}</span>
                    </div>
                  </div>
                )}

                {/* Payment Methods */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-gray-700">
                    Select Payment Method
                  </h4>

                  {/* Paystack Option */}
                  <button
                    onClick={() => handlePaymentMethodSelect("paystack")}
                    disabled={
                      paymentLoading ||
                      !userPaymentAmount ||
                      userPaymentAmount <= 0
                    }
                    className="w-full p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <CreditCard size={20} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-800">
                            Pay with Paystack
                          </p>
                          <p className="text-sm text-gray-600">
                            Card, Bank Transfer, USSD
                          </p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-gray-400" />
                    </div>
                  </button>

                  {/* Other Payment Methods (Placeholder) */}
                  <button
                    onClick={() => handlePaymentMethodSelect("bank")}
                    disabled={true}
                    className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                          <FileText size={20} className="text-gray-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-800">
                            Bank Transfer
                          </p>
                          <p className="text-sm text-gray-600">Coming Soon</p>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <Lock size={16} className="text-blue-600 mr-2 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Secure Payment</p>
                      <p className="mt-1 text-xs">
                        Your payment information is encrypted and secure. We never
                        store your card details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowPaymentMethodModal(false);
                      setPaymentError(null);
                      setUserPaymentAmount(0);
                      setAmountTouched(false);
                    }}
                    disabled={paymentLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>

                {/* Contact Support Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Need help with payment?
                    </p>
                    <button
                      onClick={handleContactSupport}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        
  {/* Enhanced Policy Details Modal */}
{showDetailsModal && selectedPolicyDetails && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Policy Details</h2>
            <p className="text-gray-600">{selectedPolicyDetails.policyNo}</p>
          </div>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
          >
            &times;
          </button>
        </div>

        {detailsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading policy details...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sum Assured</p>
                    <p className="text-xl font-bold text-blue-700">
                      {formatCurrency(selectedPolicyDetails.sumAssured || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Premium</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatCurrency(selectedPolicyDetails.basicPremium || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Policy Term</p>
                    <p className="text-xl font-bold text-purple-700">
                      {selectedPolicyDetails.duration} years
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Sections in Tabs */}
            <div>
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button className="border-b-2 border-blue-500 text-blue-600 px-1 py-4 text-sm font-medium">
                    Policy Information
                  </button>
                
                </nav>
              </div>

              {/* Policy Information Tab Content */}
              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Column 1 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPolicyDetails.policyNo}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.covertype}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cover Code</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.coverCode}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                        selectedPolicyDetails.status === "active" ? "bg-green-100 text-green-800" :
                        selectedPolicyDetails.status === "expired" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {selectedPolicyDetails.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedPolicyDetails.startDate)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maturity Date</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedPolicyDetails.endDate)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.duration} years</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Frequency of Payment</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.fop || "Not specified"}</p>
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Agent Code</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.agentcode}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Agent Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.agentDescription}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Branch Code</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.brCode}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Remarks</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.remarks}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700">Sum Assured</label>
                      <p className="mt-1 text-xl font-bold text-blue-600">
                        {formatCurrency(selectedPolicyDetails.sumAssured || 0)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700">Basic Premium</label>
                      <p className="mt-1 text-xl font-bold text-green-600">
                        {formatCurrency(selectedPolicyDetails.basicPremium || 0)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700">Total Premium</label>
                      <p className="mt-1 text-xl font-bold text-purple-600">
                        {formatCurrency(selectedPolicyDetails.totalPremium || 0)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                      <p className={`mt-1 text-xl font-bold ${
                        selectedPolicyDetails.paymentStatus === "paid" ? "text-green-600" :
                        selectedPolicyDetails.paymentStatus === "unpaid" ? "text-red-600" :
                        "text-yellow-600"
                      }`}>
                        {selectedPolicyDetails.paymentStatus?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedPolicyDetails.title} {selectedPolicyDetails.surName} {selectedPolicyDetails.otherNames}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(selectedPolicyDetails.dateofBirth)} (Age: {selectedPolicyDetails.age})
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.sex}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.maritalStatus}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Occupation</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.occupation}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.email}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.mobilePhone || selectedPolicyDetails.landphone}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">National ID</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.nationalID?.trim() || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.address}</p>
                    <p className="mt-1 text-sm text-gray-600">{selectedPolicyDetails.state}, Nigeria</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.contactName}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.contactPhone}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Address</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.contactAddress}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Job</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPolicyDetails.contactJob}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                  {selectedPolicyDetails.paymentStatus === "unpaid" && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleOpenPaymentMethodModal(selectedPolicyDetails);
                      }}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                    >
                      <CreditCard size={16} className="mr-2" />
                      Make Payment
                    </button>
                  )}
                  
                  <button
                    onClick={handleContactSupport}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <Phone size={16} className="mr-2" />
                    Contact Support
                  </button>
                  
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
      </main>
    </div>
  );
};

export default PolicyHistory;