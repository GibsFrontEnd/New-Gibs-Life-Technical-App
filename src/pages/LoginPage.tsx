// @ts-nocheck
import { z } from "zod";
import { standInToken } from "../utils/sessionStore";
import { Button } from "../components/UI/new-button";
import { Card, CardContent } from "../components/UI/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/UI/form";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Password } from "../components/UI/new-input";
import { useToast } from "../components/UI/use-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { store } from "../features/store";
import { setTokenExpired } from "../features/reducers/authReducers/authSlice";
import { SERVER_URL } from "../utils/constants";
import { encryptData } from "../utils/encrypt-utils";
import AuthShell from "../components/Auth/AuthShell";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
  FaSpinner,
  FaShieldAlt,
  FaUserPlus,
  FaUserTie,
  FaKey,
  FaCheck,
  FaRedo,
  FaArrowLeft,
} from "react-icons/fa";

// Login Schema
const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

// Customer Setup Schema
const customerSetupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Forgot Password Schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Verify Reset Code Schema
const verifyCodeSchema = z.object({
  code: z.string().min(4, "Please enter the verification code"),
});

// Reset Password Schema
const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomerSetup, setIsCustomerSetup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<
    "email" | "code" | "reset"
  >("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const redirectTo = localStorage.getItem("redirectAfterLogin") || "/dashboard";
  const { toast } = useToast();

  // API endpoint
  const API_BASE_URL = SERVER_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
  }, [navigate]);

  // Login Form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Customer Setup Form
  const customerSetupForm = useForm<z.infer<typeof customerSetupSchema>>({
    resolver: zodResolver(customerSetupSchema),
    defaultValues: {
      email: "",
      phoneNumber: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Forgot Password Forms
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const verifyCodeForm = useForm<z.infer<typeof verifyCodeSchema>>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Login Handler - COMPLETELY FIXED VERSION
  async function onLoginSubmit(data: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    setError("");

    try {
      

      const loginUrl = `${API_BASE_URL}/Auth/login`;
      

      const response = await axios.post(
        loginUrl,
        { username: data.username, password: data.password }, // in the body, not the URL

        {
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      if (response.status === 200) {
        const responseData = response.data;

        if (responseData.token || responseData.claims) {
          const token = standInToken(responseData); // the real token is in the HttpOnly cookie

          // SMART ROLE DETECTION BASED ON userType
          let userRole = "agent"; // default
          let userType = responseData.userType || null; // Define userType at the top level

          // Method 1: Check userType field (this is what your backend uses)
          if (userType) {
            const normalizedUserType = userType.toLowerCase();
            

            // Map userType to role
            if (
              normalizedUserType === "customer" ||
              normalizedUserType === "insured"
            ) {
              userRole = "customer";
            } else if (
              normalizedUserType === "admin" ||
              normalizedUserType === "administrator"
            ) {
              userRole = "admin";
            } else if (
              normalizedUserType === "agent" ||
              normalizedUserType === "user"
            ) {
              userRole = "agent";
            }
            
          }
          // Method 2: Check if it's a customer by email pattern
          else if (data.username.includes("@")) {
            userRole = "customer";
         
          }
          // Method 3: Check if username contains patterns
          else if (data.username.toLowerCase().includes("admin")) {
            userRole = "admin";
           
          } else if (data.username.toLowerCase().includes("customer")) {
            userRole = "customer";
           
          } 

          // Store authentication data - FIXED
          localStorage.setItem("token", token);
          localStorage.setItem("userRole", userRole);
          localStorage.setItem("user", encryptData(responseData));
          localStorage.setItem("unEncryptedUser", JSON.stringify(responseData));

          // IMPORTANT: Only store agentId if the user is actually an agent
          // Check if the response has an agent object with agentID
          if (responseData.agent && responseData.agent.agentID) {
            const agentId = responseData.agent.agentID;
            localStorage.setItem("agentId", agentId);
            

            // Also store the agent name - try from response data first, then from JWT token
            let agentName =
              responseData.agent.agentName || responseData.agent.agent || responseData.agent.description || "";
            if (!agentName) {
              try {
                const tokenPayload = JSON.parse(atob(token.split(".")[1]));
                agentName = tokenPayload.AgentName || "";
              } catch (e) {
                console.error("Error extracting AgentName from token:", e);
              }
            }
            if (agentName) {
              localStorage.setItem("agentName", agentName);
              
            }
          } else {
            // For non-agents (admins, users), remove any existing agentId
            localStorage.removeItem("agentId");
            localStorage.removeItem("agentName");
            
          }

          

          toast({
            title: "Login successful!",
            description: "You have been successfully logged in.",
            variant: "success",
            duration: 3000,
          });

          store.dispatch(setTokenExpired(false));
          localStorage.removeItem("redirectAfterLogin");

          

          // ROLE-BASED REDIRECTION - UPDATED
          switch (userRole) {
            case "customer":
             
              navigate("/dashboard", { replace: true }); // Changed from "/customer/dashboard"
              break;
            case "admin":
              
              navigate("/admin", { replace: true });
              break;
            case "agent":
            default:
              
              navigate("/dashboard", { replace: true });
          }
        } else {
          throw new Error("Invalid response: No token received");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);

      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }

      const status =
        (axios.isAxiosError(error) && error.response?.status) || null;

      if (status === 401) {
        setError(
          "Invalid username or password. Please check your credentials and try again.",
        );
        toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          variant: "destructive",
          duration: 5000,
        });
      } else if (status === 400) {
        setError("Bad request. Please check your input.");
        toast({
          title: "Invalid Request",
          description: "Please check your input format.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        const errorMessage =
          error?.message || "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Customer Setup Handler - UPDATED
  async function onCustomerSetupSubmit(
    data: z.infer<typeof customerSetupSchema>,
  ) {
    setIsLoading(true);
    setError("");

    if (data.newPassword !== data.confirmPassword) {
      const mismatchMessage = "Confirm password must match the new password.";
      setError(mismatchMessage);
      toast({
        title: "Password mismatch",
        description: mismatchMessage,
        variant: "destructive",
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        email: data.email.trim(),
        phoneNumber: data.phoneNumber.trim(),
        newPassword: data.newPassword,
      };

      const setupUrl = `${API_BASE_URL}/Auth/setup-customer-password`;
      const response = await fetch(setupUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Failed to set up customer account.";
        try {
          const errorBody = await response.json();
          message = errorBody?.message || message;
        } catch (err) {
          // Ignore JSON parse errors and use default message
        }

        throw new Error(message);
      }

      localStorage.setItem("justSetupCustomer", "true");

      toast({
        title: "Customer Account Created!",
        description: "You can now login with your email and password.",
        variant: "success",
        duration: 5000,
      });

      setIsCustomerSetup(false);
      loginForm.setValue("username", data.email);
    } catch (error: any) {
      const fallbackMessage =
        error?.message || "Unable to set up account. Please try again.";
      setError(fallbackMessage);

      toast({
        title: "Setup Failed",
        description: fallbackMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Forgot Password Handlers
  async function onForgotPasswordSubmit(
    data: z.infer<typeof forgotPasswordSchema>,
  ) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/forgot-password`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        let message = "Failed to send reset code.";
        try {
          const errorBody = await response.json();
          message = errorBody?.message || message;
        } catch (err) {
          // Ignore
        }
        throw new Error(message);
      }

      setResetEmail(data.email);
      setForgotPasswordStep("code");
      toast({
        title: "Code Sent!",
        description: "A reset code has been sent to your email.",
        variant: "success",
        duration: 5000,
      });
    } catch (error: any) {
      const fallbackMessage = error?.message || "Failed to send reset code.";
      setError(fallbackMessage);
      toast({
        title: "Error",
        description: fallbackMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onVerifyCodeSubmit(data: z.infer<typeof verifyCodeSchema>) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/verify-reset-code`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail, code: data.code }),
      });

      if (!response.ok) {
        let message = "Invalid or expired code.";
        try {
          const errorBody = await response.json();
          message = errorBody?.message || message;
        } catch (err) {
          // Ignore
        }
        throw new Error(message);
      }

      setResetCode(data.code);
      setForgotPasswordStep("reset");
      toast({
        title: "Code Verified!",
        description: "You can now reset your password.",
        variant: "success",
        duration: 5000,
      });
    } catch (error: any) {
      const fallbackMessage = error?.message || "Invalid or expired code.";
      setError(fallbackMessage);
      toast({
        title: "Verification Failed",
        description: fallbackMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetPasswordSubmit(
    data: z.infer<typeof resetPasswordSchema>,
  ) {
    setIsLoading(true);
    setError("");

    if (data.newPassword !== data.confirmPassword) {
      const mismatchMessage = "Passwords don't match.";
      setError(mismatchMessage);
      toast({
        title: "Password Mismatch",
        description: mismatchMessage,
        variant: "destructive",
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        let message = "Failed to reset password.";
        try {
          const errorBody = await response.json();
          message = errorBody?.message || message;
        } catch (err) {
          // Ignore
        }
        throw new Error(message);
      }

      toast({
        title: "Password Reset!",
        description: "Your password has been reset successfully.",
        variant: "success",
        duration: 5000,
      });

      // Reset state and go back to login
      setIsForgotPassword(false);
      setForgotPasswordStep("email");
      setResetEmail("");
      setResetCode("");
      loginForm.setValue("username", resetEmail);
    } catch (error: any) {
      const fallbackMessage = error?.message || "Failed to reset password.";
      setError(fallbackMessage);
      toast({
        title: "Reset Failed",
        description: fallbackMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onResendCode() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/resend-reset-code`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        let message = "Failed to resend code.";
        try {
          const errorBody = await response.json();
          message = errorBody?.message || message;
        } catch (err) {
          // Ignore
        }
        throw new Error(message);
      }

      toast({
        title: "Code Resent!",
        description: "A new reset code has been sent to your email.",
        variant: "success",
        duration: 5000,
      });
    } catch (error: any) {
      const fallbackMessage = error?.message || "Failed to resend code.";
      toast({
        title: "Error",
        description: fallbackMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell backTo={null}>
      <div className="w-full">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 [@media(max-height:760px)]:text-2xl">
          {isForgotPassword ? "Reset your password" : isCustomerSetup ? "Set up your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-left text-sm text-slate-500">
          {isForgotPassword
            ? forgotPasswordStep === "email"
              ? "Enter your email to receive a password reset code."
              : forgotPasswordStep === "code"
                ? "Enter the verification code sent to your email."
                : "Create a new password for your account."
            : isCustomerSetup
              ? "Setup your customer account to access your insurance dashboard."
              : "Log in to manage insurance quotations, create proposals, and streamline your insurance operations efficiently."}
        </p>



        {/* Back to Sign In button (on customer setup form) */}
        {isCustomerSetup && !isForgotPassword && (
          <div className="flex gap-4 mt-6 mb-4">
            <Button
              type="button"
              onClick={() => setIsCustomerSetup(false)}
              className="flex items-center gap-2 text-white border-0"
              style={{ background: "#155dfd" }}
            >
              <FaArrowLeft />
              Back to Sign In
            </Button>
          </div>
        )}

        {/* Back to Sign In button (on forgot password form) */}
        {isForgotPassword && (
          <div className="flex gap-4 mt-6 mb-4">
            <Button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setForgotPasswordStep("email");
                setResetEmail("");
                setResetCode("");
                setError("");
              }}
              className="flex items-center gap-2 text-white border-0"
              style={{ background: "#155dfd" }}
            >
              <FaArrowLeft />
              Back to Sign In
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="w-full p-4 mb-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <FaExclamationTriangle />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        {!isCustomerSetup && !isForgotPassword && (
          <Form {...loginForm}>
            <form
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
              className="space-y-6 w-full mt-4 animate-fadeInUp"
            >
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Username or Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.username or email@example.com"
                        type="text"
                        autoComplete="username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Password</FormLabel>
                    <Password
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your password"
                      // @ts-ignore
                      autoComplete="current-password"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                // @ts-ignore
                type="submit"
                className="w-full text-white border-0"
                style={{ background: "#155dfd" }}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaLock />
                )}
                Sign In
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-[#155dfd] hover:text-[#0f4bd1] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </Form>
        )}

        {/* Customer Setup Form */}
        {isCustomerSetup && (
          <Form {...customerSetupForm}>
            <form
              onSubmit={customerSetupForm.handleSubmit(onCustomerSetupSubmit)}
              className="space-y-6 w-full mt-4 animate-fadeInUp"
            >
              <FormField
                control={customerSetupForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.email@example.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customerSetupForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="08012345678"
                        type="tel"
                        autoComplete="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customerSetupForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      New Password
                    </FormLabel>
                    <Password
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your new password"
                      // @ts-ignore
                      autoComplete="new-password"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customerSetupForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Confirm Password
                    </FormLabel>
                    <Password
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Confirm your password"
                      // @ts-ignore
                      autoComplete="new-password"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                // @ts-ignore
                type="submit"
                className="w-full text-white border-0"
                style={{ background: "#155dfd" }}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaShieldAlt />
                )}
                Setup Customer Account
              </Button>
            </form>
          </Form>
        )}

        {/* Forgot Password - Email Step */}
        {isForgotPassword && forgotPasswordStep === "email" && (
          <Form {...forgotPasswordForm}>
            <form
              onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}
              className="space-y-6 w-full mt-4 animate-fadeInUp"
            >
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.email@example.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                // @ts-ignore
                type="submit"
                className="w-full text-white border-0"
                style={{ background: "#155dfd" }}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? <FaSpinner className="animate-spin" /> : <FaKey />}
                Send Reset Code
              </Button>
            </form>
          </Form>
        )}

        {/* Forgot Password - Verify Code Step */}
        {isForgotPassword && forgotPasswordStep === "code" && (
          <Form {...verifyCodeForm}>
            <form
              onSubmit={verifyCodeForm.handleSubmit(onVerifyCodeSubmit)}
              className="space-y-6 w-full mt-4 animate-fadeInUp"
            >
              <FormField
                control={verifyCodeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Verification Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 6-digit code"
                        type="text"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  // @ts-ignore
                  type="submit"
                  className="flex-1 text-white border-0"
                  style={{ background: "#155dfd" }}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCheck />
                  )}
                  Verify Code
                </Button>

                <Button
                  // @ts-ignore
                  type="button"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                  onClick={onResendCode}
                  disabled={isLoading}
                >
                  <FaRedo />
                  Resend
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Forgot Password - Reset Password Step */}
        {isForgotPassword && forgotPasswordStep === "reset" && (
          <Form {...resetPasswordForm}>
            <form
              onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}
              className="space-y-6 w-full mt-4 animate-fadeInUp"
            >
              <FormField
                control={resetPasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      New Password
                    </FormLabel>
                    <Password
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your new password"
                      // @ts-ignore
                      autoComplete="new-password"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resetPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Confirm Password
                    </FormLabel>
                    <Password
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Confirm your new password"
                      // @ts-ignore
                      autoComplete="new-password"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                // @ts-ignore
                type="submit"
                className="w-full text-white border-0"
                style={{ background: "#155dfd" }}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaLock />
                )}
                Reset Password
              </Button>
            </form>
          </Form>
        )}
      </div>


      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }
        
        .animate-slideDown {
          animation: slideDown 1.2s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1.2s ease-out forwards;
        }
      `}</style>
    </AuthShell>
  );
};

export default LoginPage;
