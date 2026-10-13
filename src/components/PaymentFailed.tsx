// PaymentFailed.tsx - FIXED VERSION WITH WORKING CONFETTI
//@ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, AlertCircle, RotateCcw, HelpCircle, Shield } from 'lucide-react';
import { detectUserType, getDashboardPath, getDashboardButtonText } from '../utils/paymentUtils';
import Confetti from 'react-confetti';

// Helper function to restore authentication from localStorage
const checkAndRestoreAuth = (): boolean => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  const userData =
    localStorage.getItem("userData") || localStorage.getItem("unEncryptedUser");

  

  if (token && userData) {
    try {
      const user = JSON.parse(userData);
 

      // Store userType based on user data
      if (user.role) {
        const userType = user.role.toLowerCase();
        localStorage.setItem("userType", userType);
        console.log("✅ Set userType from role:", userType);
      } else if (user.userType) {
        localStorage.setItem("userType", user.userType);
        console.log("✅ Set userType from userType:", user.userType);
      }

      return true;
    } catch (error) {
      console.error("❌ Error parsing user data:", error);
    }
  }

  // Check for agent-specific data
  const agentData = localStorage.getItem("agentData");
  if (token && agentData) {
    try {
      const agent = JSON.parse(agentData);
      console.log("✅ Restored agent data:", agent);
      localStorage.setItem("userType", "agent");
      return true;
    } catch (error) {
      console.error("❌ Error parsing agent data:", error);
    }
  }

  // Check for admin-specific data
  const adminData = localStorage.getItem("adminData");
  if (token && adminData) {
    try {
      const admin = JSON.parse(adminData);
      console.log("✅ Restored admin data:", admin);
      localStorage.setItem("userType", "admin");
      return true;
    } catch (error) {
      console.error("❌ Error parsing admin data:", error);
    }
  }

  return false;
};

// Function to get policy history path based on user type
const getPolicyHistoryPath = (userType: string): string => {
  switch (userType) {
    case "agent":
      return "/agent/policies";
    case "admin":
      return "/admin/policies";
    case "customer":
      return "/policy-history";
    default:
      return "/policy-history";
  }
};

const PaymentFailed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [reference, setReference] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [userType, setUserType] = useState<string>("customer");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [runConfetti, setRunConfetti] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    console.log("❌ PaymentFailed mounted");
    console.log("📋 Full URL:", window.location.href);
    console.log("🔍 URL params:", Object.fromEntries(searchParams.entries()));

    // Handle window resize
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Restore authentication
    console.log("🔐 Attempting to restore authentication...");
    const authRestored = checkAndRestoreAuth();
    setIsAuthenticated(authRestored);
    console.log(
      "🔐 Auth restoration result:",
      authRestored ? "SUCCESS" : "FAILED"
    );

    const referenceParam =
      searchParams.get("reference") || searchParams.get("trxref");
    const errorParam = searchParams.get("message") || searchParams.get("error");

    if (referenceParam) {
      setReference(referenceParam);
      console.log("📌 Reference found:", referenceParam);
    }

    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
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
    localStorage.setItem("userType", detectedUserType);
    console.log("👤 User type set to:", detectedUserType);

    // Simulate verification delay
    const timer = setTimeout(() => {
      setIsVerifying(false);
      console.log("❌ Payment failure verification complete");
    }, 1500);

    // Stop particles after 3 seconds
    const particleTimer = setTimeout(() => {
      setShowParticles(false);
      setRunConfetti(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(particleTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [searchParams]);

  // Add CSS for animations
  const styles = `
    @keyframes fall {
      0% {
        transform: translateY(-100px) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 0.7;
      }
      100% {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }
    
    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-5px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(5px);
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
    
    .animate-fall {
      animation: fall linear infinite;
    }
    
    .animate-shake {
      animation: shake 0.8s ease-in-out;
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s ease-out forwards;
    }
    
    .animate-fade-in-up {
      animation: fade-in-up 0.8s ease-out forwards;
    }
    
    .confetti-canvas {
      position: fixed !important;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    }
  `;

  // Render loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <style>{styles}</style>
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-red-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <RotateCcw className="w-10 h-10 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Checking Transaction
              </h2>
              <p className="text-gray-600">
                We're verifying your payment status...
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDashboardNavigation = () => {
    console.log("📍 Dashboard navigation clicked");
    console.log("🔐 Auth status:", isAuthenticated);

    if (isAuthenticated) {
      const dashboardPath = getDashboardPath();
      console.log("🚀 Navigating to dashboard:", dashboardPath);
      navigate(dashboardPath);
    } else {
      console.log("🔐 User not authenticated, redirecting to login");

      const dashboardPath = getDashboardPath();
      sessionStorage.setItem("redirectAfterLogin", dashboardPath);
      sessionStorage.setItem("postPaymentReference", reference);
      sessionStorage.setItem("postPaymentUserType", userType);

      navigate("/login", {
        state: {
          fromPayment: true,
          message: "Please login to access your dashboard",
          reference: reference,
          userType: userType,
          redirectTo: dashboardPath,
        },
      });
    }
  };

  const handlePolicyHistoryNavigation = () => {
    const policyHistoryPath = getPolicyHistoryPath(userType);
    console.log("📍 Policy history navigation clicked");
    console.log("🔐 Auth status:", isAuthenticated);
    console.log("📍 Policy history path:", policyHistoryPath);

    if (isAuthenticated) {
      console.log("🚀 Navigating to policy history:", policyHistoryPath);
      navigate(policyHistoryPath);
    } else {
      console.log("🔐 User not authenticated, redirecting to login");

      sessionStorage.setItem("redirectAfterLogin", policyHistoryPath);
      sessionStorage.setItem("postPaymentReference", reference);
      sessionStorage.setItem("postPaymentUserType", userType);

      navigate("/login", {
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

  return (
    <>
      <style>{styles}</style>

      {/* Confetti effect - FIXED POSITION */}
      {runConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            numberOfPieces={150}
            recycle={false}
            gravity={0.15}
            colors={["#DC2626", "#EF4444", "#F87171", "#FCA5A5", "#FECACA"]}
            confettiSource={{
              x: windowDimensions.width / 2,
              y: windowDimensions.height / 2,
              w: 0,
              h: 0,
            }}
            initialVelocityY={15}
            initialVelocityX={5}
            wind={0.02}
            opacity={0.8}
            tweenDuration={3000}
            onConfettiComplete={() => {
              setRunConfetti(false);
            }}
            ref={confettiRef}
            className="confetti-canvas"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
            }}
          />
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background particles */}
        {showParticles && (
          <>
            {/* Falling X marks */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-fall text-red-400 opacity-50"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                  fontSize: `${12 + Math.random() * 20}px`,
                  zIndex: 1,
                }}
              >
                ✗
              </div>
            ))}
          </>
        )}

        {/* Animated warning triangles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-400 opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${24 + Math.random() * 32}px`,
                animationDelay: `${Math.random() * 2}s`,
                zIndex: 1,
              }}
            >
              ⚠️
            </div>
          ))}
        </div>

        <div
          ref={containerRef}
          className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-red-100 z-20 relative transform transition-all duration-500 hover:scale-[1.01]"
          style={{ position: "relative", zIndex: 20 }}
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 p-10 text-center relative overflow-hidden">
            {/* Pulsing background effect */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-40 h-40 bg-white/10 rounded-full animate-ping opacity-20"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Auth status indicator */}
            {!isAuthenticated && (
              <div className="absolute top-4 left-4 z-20">
                <div className="inline-flex items-center px-3 py-1 bg-yellow-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm border border-yellow-300 animate-pulse">
                  <Shield className="w-3 h-3 mr-1" />
                  Session Restored
                </div>
              </div>
            )}

            {/* Warning icon */}
            <div className="absolute top-4 right-4 z-20 animate-pulse">
              <AlertCircle className="w-6 h-6 text-white opacity-70" />
            </div>

            <div className="relative z-10">
              {/* Animated X circle */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute w-32 h-32 bg-white/20 rounded-full animate-ping opacity-50"></div>
                <div className="absolute w-28 h-28 bg-white/30 rounded-full animate-pulse"></div>
                <div className="w-24 h-24 bg-white rounded-full border-4 border-red-300 flex items-center justify-center shadow-lg relative">
                  <XCircle
                    className="w-14 h-14 text-red-600 animate-shake"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <h1 className="mt-4 text-3xl font-bold text-white animate-fade-in">
                Payment Failed
              </h1>
              <p
                className="mt-2 text-red-100 text-lg animate-fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                We couldn't process your payment
              </p>

              {/* Failed badge */}
              <div className="inline-flex items-center px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mt-4 animate-fade-in-up">
                <XCircle className="w-4 h-4 text-white mr-2" />
                <span className="text-sm text-white font-medium">
                  Transaction Not Completed
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-10">
            <div className="space-y-8">
              {/* Error message with icon */}
              <div
                className="text-center space-y-3 animate-fade-in"
                style={{ animationDelay: "0.4s" }}
              >
                <div
                  className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-shake"
                  style={{ animationDelay: "0.6s" }}
                >
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Your payment could not be processed. No charges were made to
                  your account.
                  {errorMessage && (
                    <span className="block mt-2 text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200 animate-fade-in-up">
                      {errorMessage}
                    </span>
                  )}
                </p>
              </div>

              {/* Reference section (if available) */}
              {reference && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6 border border-red-200 animate-fade-in-up shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Transaction Reference
                      </p>
                      <p className="font-mono text-xl font-bold text-gray-900 tracking-tight bg-white px-3 py-2 rounded-lg border border-red-200">
                        {reference}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <p className="text-sm text-gray-600">
                      If you need assistance with this transaction, please
                      provide this reference number to our support team.
                    </p>
                  </div>
                </div>
              )}

              {/* Common issues */}
              <div
                className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 animate-fade-in"
                style={{ animationDelay: "0.8s" }}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-3 text-lg">
                      Common Payment Issues:
                    </h3>
                    <ul className="space-y-2 text-sm text-yellow-700">
                      <li className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />
                        Insufficient funds in your account
                      </li>
                      <li className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />
                        Incorrect card details entered
                      </li>
                      <li className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />
                        Daily transaction limit reached
                      </li>
                      <li className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />
                        Card issuer declined the transaction
                      </li>
                      <li className="flex items-center">
                        <XCircle className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />
                        Network connectivity issues
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
             {/* Action buttons */}
<div className="space-y-4 animate-fade-in" style={{ animationDelay: "1s" }}>
  <button
    onClick={() => navigate('/policy-history')}
    className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center space-x-3 text-lg group relative overflow-hidden"
  >
    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    <RotateCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
    <span>Try Payment Again</span>
  </button>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <button
      onClick={() => navigate('/dashboard')}
      className="py-3 px-6 border-2 border-red-600 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center space-x-2 group"
    >
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      <span>Back to Dashboard</span>
    </button>

    <button
      onClick={() => navigate('/csu/tickets')}
      className="py-3 px-6 border-2 border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center space-x-2 group"
    >
      <AlertCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span>Contact Support</span>
    </button>
  </div>

  <button
    onClick={() => navigate('/policy-history')}
    className="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center"
  >
    View Policy History
  </button>
</div>

              {/* Support info */}
              <div
                className="pt-8 border-t border-gray-200 animate-fade-in"
                style={{ animationDelay: "1.2s" }}
              >
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Need immediate help?</span>{" "}
                      Our support team is available 24/7. Call us at{" "}
                      <a
                        href="tel:+2348000000000"
                        className="text-red-600 font-semibold hover:underline hover:text-red-700 transition-colors"
                      >
                        +234 800 000 0000
                      </a>{" "}
                      or email{" "}
                      <a
                        href="mailto:support@gibslife.com"
                        className="text-red-600 font-semibold hover:underline hover:text-red-700 transition-colors"
                      >
                        support@gibslife.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety notice */}
              <div
                className="text-center animate-fade-in"
                style={{ animationDelay: "1.4s" }}
              >
                <div className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <p className="text-sm text-gray-600">
                    For security reasons, we recommend checking with your bank
                    before attempting another payment.
                  </p>
                </div>
              </div>
              
            
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentFailed;
