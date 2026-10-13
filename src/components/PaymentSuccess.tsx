// PaymentSuccess.tsx - COMPLETE UPDATED VERSION WITH CONFETTI
//@ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, AlertCircle, Loader2, Shield, Sparkles } from 'lucide-react';
import { detectUserType, getDashboardPath, getDashboardButtonText } from '../utils/paymentUtils';
import Confetti from 'react-confetti';
import { SERVER_URL } from '../utils/constants';

// Helper function to restore authentication from localStorage
const checkAndRestoreAuth = (): boolean => {
  const token = localStorage.getItem('token');
  
  // If token exists, user is authenticated - that's all we need
  if (token) {
    console.log('✅ Token found - user is authenticated');
    
    // Set userType from whatever is available
    const storedUserType = localStorage.getItem('userType');
    const userData = localStorage.getItem('userData') || localStorage.getItem('unEncryptedUser');
    const agentData = localStorage.getItem('agentData');
    const adminData = localStorage.getItem('adminData');

    if (!storedUserType) {
      if (agentData) localStorage.setItem('userType', 'agent');
      else if (adminData) localStorage.setItem('userType', 'admin');
      else if (userData) {
        try {
          const user = JSON.parse(userData);
          localStorage.setItem('userType', user.role?.toLowerCase() || user.userType?.toLowerCase() || 'customer');
        } catch {}
      } else {
        localStorage.setItem('userType', 'customer');
      }
    }

    return true;
  }

  console.log('❌ No token found - user is not authenticated');
  return false;
};

// Function to properly get policy history path based on user type
const getPolicyHistoryPath = (userType: string): string => {
  switch (userType) {
    case "agent":
      return "/agent/policies"; // or '/agent/policy-history' based on your routes
    case "admin":
      return "/admin/policies"; // or '/admin/policy-history'
    case "customer":
      return "/policy-history";
    default:
      return "/policy-history";
  }
};

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [reference, setReference] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [userType, setUserType] = useState<string>("customer");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [paymentVerified, setPaymentVerified] = useState<boolean>(false);
  const [policyHistoryPath, setPolicyHistoryPath] =
    useState<string>("/policy-history");
  const [showConfetti, setShowConfetti] = useState<boolean>(true);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("💰 PaymentSuccess mounted");
    console.log("📋 Full URL:", window.location.href);
    console.log("🔍 URL params:", Object.fromEntries(searchParams.entries()));

    // Handle window resize for confetti
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // ✅ CRITICAL: RESTORE AUTH IMMEDIATELY with enhanced detection
    console.log("🔐 Attempting to restore authentication...");
    const authRestored = checkAndRestoreAuth();
    setIsAuthenticated(authRestored);
    console.log(
      "🔐 Auth restoration result:",
      authRestored ? "SUCCESS" : "FAILED"
    );

    // Check current auth status
    const currentToken = localStorage.getItem("token");
    console.log(
      "🔑 Current token in localStorage:",
      currentToken ? `EXISTS (${currentToken.substring(0, 20)}...)` : "MISSING"
    );

    const referenceParam =
      searchParams.get("reference") || searchParams.get("trxref");
    if (referenceParam) {
      setReference(referenceParam);
      console.log("📌 Reference found:", referenceParam);

      // Store for verification
      localStorage.setItem("lastPaymentReference", referenceParam);
    }

    // Check for payment success data in sessionStorage
    const paymentSuccessData = sessionStorage.getItem("paymentSuccessData");
    if (paymentSuccessData) {
      try {
        const data = JSON.parse(paymentSuccessData);
        console.log("💾 Found payment success data:", data);

        // Use this data if URL params are missing
        if (!referenceParam && data.reference) {
          setReference(data.reference);
          localStorage.setItem("lastPaymentReference", data.reference);
        }

        // Clean up after use
        sessionStorage.removeItem("paymentSuccessData");
      } catch (error) {
        console.error("Error parsing payment success data:", error);
      }
    }

    // Enhanced user type detection
    const detectUserTypeWithFallback = (): string => {
      console.log("🔍 Enhanced user type detection...");

      // 1. Check URL parameters first
      const urlUserType = searchParams.get("userType");
      if (
        urlUserType &&
        ["agent", "admin", "customer"].includes(urlUserType.toLowerCase())
      ) {
        console.log("✅ User type from URL:", urlUserType);
        return urlUserType.toLowerCase();
      }

      // 2. Check localStorage for userType
      const storedUserType = localStorage.getItem("userType");
      if (
        storedUserType &&
        ["agent", "admin", "customer"].includes(storedUserType.toLowerCase())
      ) {
        console.log("✅ User type from localStorage:", storedUserType);
        return storedUserType.toLowerCase();
      }

      // 3. Check user data in localStorage
      const userDataStr =
        localStorage.getItem("userData") ||
        localStorage.getItem("unEncryptedUser");
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (
            userData.role &&
            ["agent", "admin", "customer"].includes(userData.role.toLowerCase())
          ) {
            console.log("✅ User type from userData.role:", userData.role);
            return userData.role.toLowerCase();
          }
          if (
            userData.userType &&
            ["agent", "admin", "customer"].includes(
              userData.userType.toLowerCase()
            )
          ) {
            console.log(
              "✅ User type from userData.userType:",
              userData.userType
            );
            return userData.userType.toLowerCase();
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

      // 4. Check for specific agent/admin data
      if (localStorage.getItem("agentData")) {
        console.log("✅ User type from agentData: agent");
        return "agent";
      }

      if (localStorage.getItem("adminData")) {
        console.log("✅ User type from adminData: admin");
        return "admin";
      }

      // 5. Default to customer
      console.log("⚠️ Defaulting to user type: customer");
      return "customer";
    };

    const detectedUserType = detectUserTypeWithFallback();
    setUserType(detectedUserType);

    // Set policy history path based on user type
    const historyPath = getPolicyHistoryPath(detectedUserType);
    setPolicyHistoryPath(historyPath);
    console.log(
      "📍 Policy history path for",
      detectedUserType + ":",
      historyPath
    );

    // Save user type consistently
    localStorage.setItem("userType", detectedUserType);
    console.log("👤 User type set to:", detectedUserType);

    // Verify payment with backend
    verifyPaymentWithBackend(referenceParam);

    // Simulate verification delay
    const timer = setTimeout(() => {
      setIsVerifying(false);
      console.log("✅ Payment verification complete");
      console.log(
        "🔐 Final authentication status:",
        isAuthenticated ? "Authenticated" : "Not Authenticated"
      );
      console.log("📊 localStorage content:", { ...localStorage });
    }, 2000);

    // Reduce confetti after 5 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(confettiTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [searchParams]);
const verifyPaymentWithBackend = async (reference: string | null) => {
  if (!reference) return;
  
  try {
    const response = await fetch(`${SERVER_URL}/api/Payment/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend verification result:', data);
      setPaymentVerified(data.status === true);
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    setPaymentVerified(false);
  }
};



  const handlePolicyHistoryNavigation = () => {
    console.log("📍 Policy history navigation clicked");
    console.log("🔐 Auth status:", isAuthenticated);
    console.log("📍 Policy history path:", policyHistoryPath);

    if (isAuthenticated) {
      console.log("🚀 Navigating to policy history:", policyHistoryPath);
      navigate(policyHistoryPath);
    } else {
      console.log('🔐 User not authenticated, redirecting to login');
      
      sessionStorage.setItem('redirectAfterLogin', policyHistoryPath);
      sessionStorage.setItem('postPaymentReference', reference);
      sessionStorage.setItem('postPaymentUserType', userType);
      
      navigate('/policy-history', {
        state: {
          fromPayment: true,
          message: `Please login to view your ${userType} policy history`,
          reference: reference,
          userType: userType,
          redirectTo: policyHistoryPath,
        },
      });
    }
  };

  // Render loading state with auth status
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-green-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <Loader2 className="w-10 h-10 text-green-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Verifying Payment
              </h2>
              <p className="text-gray-600">
                Please wait while we confirm your payment...
              </p>

              {/* Auth status indicator */}
              <div
                className={`inline-flex items-center px-4 py-2 rounded-lg ${
                  isAuthenticated
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  {isAuthenticated
                    ? "✅ Authenticated"
                    : "🔄 Restoring Session..."}
                </span>
              </div>

              {reference && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    Transaction Reference
                  </p>
                  <p className="text-gray-800 font-mono font-medium">
                    {reference}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  This may take a few moments. Please don't close this window.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Celebration */}
      {showConfetti && (
        <>
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.1}
            colors={[
              "#10B981",
              "#059669",
              "#34D399",
              "#6EE7B7",
              "#A7F3D0",
              "#ECFDF5",
            ]}
            confettiSource={{
              x: windowDimensions.width / 2,
              y: windowDimensions.height / 2,
              w: 0,
              h: 0,
            }}
            initialVelocityY={15}
            initialVelocityX={5}
          />

          {/* Additional floating sparkles */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}vw`,
                top: `${Math.random() * 100}vh`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400 opacity-70" />
            </div>
          ))}
        </>
      )}

      {/* Floating celebration elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div
        ref={containerRef}
        className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100 z-10 relative transform transition-all duration-500 hover:scale-[1.01]"
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-10 text-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-32 h-32 bg-white/5 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          {/* Auth status indicator in header */}
          {!isAuthenticated && (
            <div className="absolute top-4 left-4 z-20">
              <div className="inline-flex items-center px-3 py-1 bg-yellow-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm border border-yellow-300 animate-pulse">
                <Shield className="w-3 h-3 mr-1" />
                Session Restored
              </div>
            </div>
          )}

          {/* Celebration icons */}
          <div className="absolute top-4 right-4 z-20">
            <Sparkles
              className="w-6 h-6 text-yellow-300 animate-spin"
              style={{ animationDuration: "3s" }}
            />
          </div>

          <div className="relative z-10">
            {/* Animated success circle */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute w-32 h-32 bg-white/20 rounded-full animate-ping"></div>
              <div className="absolute w-28 h-28 bg-white/30 rounded-full animate-pulse"></div>
              <div className="w-24 h-24 bg-white rounded-full border-4 border-emerald-300 flex items-center justify-center shadow-lg relative">
                <CheckCircle
                  className="w-14 h-14 text-emerald-600 animate-bounce"
                  strokeWidth={1.5}
                />
              </div>
            </div>

            <h1 className="mt-4 text-3xl font-bold text-white animate-fade-in">
              Payment Successful!
            </h1>
            <p
              className="mt-2 text-green-100 text-lg animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Thank you for your payment
            </p>

            {/* Success badge with animation */}
            <div className="inline-flex items-center px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mt-4 animate-fade-in-up">
              <CheckCircle className="w-4 h-4 text-white mr-2 animate-pulse" />
              <span className="text-sm text-white font-medium">
                Transaction Completed
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-10">
          <div className="space-y-8">
            {/* Success message with icon */}
            <div
              className="text-center space-y-3 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <div
                className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce"
                style={{ animationDelay: "0.6s" }}
              >
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Your payment was processed successfully. An automated payment
                receipt will be sent to your registered email.
              </p>

              {/* Payment verification status */}
              {paymentVerified && (
                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full animate-fade-in">
                  <CheckCircle
                    className="w-3 h-3 mr-1 animate-spin"
                    style={{ animationDuration: "2s" }}
                  />
                  Payment verified with our system
                </div>
              )}
            </div>

            {/* Reference section */}
            {reference && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 animate-fade-in-up shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Transaction Reference
                    </p>
                    <p className="font-mono text-xl font-bold text-gray-900 tracking-tight bg-white px-3 py-2 rounded-lg border border-green-200">
                      {reference}
                    </p>

                    {/* User type indicator with icon */}
                    <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs rounded-lg mt-3 border border-blue-200">
                      <span className="mr-2">
                        {userType === "agent"
                          ? "👨‍💼"
                          : userType === "admin"
                          ? "👑"
                          : "👤"}
                      </span>
                      <span className="font-medium">
                        {userType.charAt(0).toUpperCase() + userType.slice(1)}{" "}
                        Account
                      </span>
                      {isAuthenticated && (
                        <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          ✓ Logged In
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm text-gray-600">
                    Save this reference number for your records. You can use it
                    to track this transaction.
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
           

             {/* Action buttons */}
<div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
  <button
    onClick={() => navigate('/dashboard')}
    className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center space-x-3 text-lg"
  >
    <ArrowLeft className="w-6 h-6" />
    <span>Back to Dashboard</span>
  </button>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <button
      onClick={() => navigate('/policy-history')}
      className="py-3 px-6 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center"
    >
      View Policy History
    </button>

    <button
      onClick={() => navigate('/')}
      className="py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center"
    >
      Back to Home
    </button>
  </div>
</div>
            </div>

            {/* Auth warning if not authenticated */}
           

            {/* Support info */}
            <div
              className="pt-8 border-t border-gray-200 animate-fade-in"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Need assistance?</span> Our
                    support team is here to help. Email us at{" "}
                    <a
                      href="mailto:support@gibslife.com"
                      className="text-green-600 font-semibold hover:underline hover:text-green-700 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      support@gibslife.com
                    </a>{" "}
                    or call{" "}
                    <a
                      href="tel:+2348000000000"
                      className="text-green-600 font-semibold hover:underline hover:text-green-700 transition-colors"
                    >
                      +234 800 000 0000
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt notice */}
            <div
              className="text-center animate-fade-in"
              style={{ animationDelay: "1.2s" }}
            >
              <div className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <p className="text-sm text-gray-600">
                  Please check your email within the next 5-10 minutes for your
                  payment receipt.
                  {!isAuthenticated && (
                    <span className="block mt-1 text-yellow-600 font-medium">
                      Your receipt will be sent to the email used for payment.
                    </span>
                  )}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;
