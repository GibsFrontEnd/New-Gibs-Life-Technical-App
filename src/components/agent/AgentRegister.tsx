// @ts-nocheck

import type React from "react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { registerAgent } from "../../api/agent";
import type { RegisterPayload } from "../../api/agent";
import type { GenericResponse } from "../../types/agent";
import { InputField } from "../common/InputField";
import {
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  FileText,
  CheckCircle,
  User,
  MapPin,
  Mail,
  CreditCard,
  AlertCircle,
  Shield,
} from "lucide-react";
import logoImage from "../../assets/logo.jpg";

type Step = 1 | 2;

const AgentRegister: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooperativeConsent, setCooperativeConsent] = useState(false);
  const [showFullConsent, setShowFullConsent] = useState(false);

  const [form, setForm] = useState<Partial<RegisterPayload>>({
    unitID: null,
    agent: "",
    address: "",
    area: "",
    city: "",
    state: "",
    phone1: "",
    phone2: null,
    faxNo: null,
    email: "",
    insPerson: null,
    finPerson: null,
    balance: 0,
    creditLimit: 0,
    comRate: 0,
    remark: null,
    accountNo: "",
    bankname: "",
    tag: "pending",
    password: "",
    attachments: [],
  });

  const navigate = useNavigate();

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    let parsed: string | number | null;
    if (type === "number") {
      parsed = value === "" ? null : Number(value);
    } else {
      parsed = value === "" ? null : value;
    }

    setForm((prev) => ({
      ...prev,
      [name]: parsed,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = Array.from(files);
    setForm((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newFiles],
    }));
  };

  const removeFile = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) ?? [],
    }));
  };

  const next = () => {
    const req = [
      form.agent,
      form.address,
      form.area,
      form.city,
      form.state,
      form.phone1,
      form.accountNo,
      form.bankname,
      form.attachments?.length,
    ];
    if (req.some((v) => !v)) {
      setError("Please fill in all required details.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const back = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    if (!cooperativeConsent) {
      setError(
        "You must consent to the Cooperative Society membership to proceed."
      );
      return;
    }

    const payload: RegisterPayload = {
      unitID: null,
      agent: form.agent!,
      address: form.address!,
      area: form.area!,
      city: form.city!,
      state: form.state!,
      phone1: form.phone1!,
      phone2: form.phone2 || null,
      faxNo: form.faxNo || null,
      email: form.email!,
      insPerson: null,
      finPerson: null,
      balance: 0,
      creditLimit: 0,
      comRate: 0,
      remark: form.remark!,
      accountNo: form.accountNo!,
      bankname: form.bankname!,
      tag: "pending",
      password: form.password!,
      attachments: form.attachments!,
    };

    setSubmitting(true);
    try {
      const res: GenericResponse = await registerAgent(payload);
      alert(res.detail || "Registration successful!");
      navigate("/agent/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Background decoration */}
      <div className="sticky inset-0 ">
        <div className="absolute -top-40 -right-0 w-80 h-80 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400 to-cyan-600 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Removed the Logo component that was causing the error */}
      <button onClick={() => navigate("/")}>
        <img
          src={logoImage}
          alt="MICROLIFE Logo"
          className="sticky top-5 left-5 w-30 h-20"
        />
      </button>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Join Our Network
          </h1>
          <p className="text-slate-600">
            Create your agent account to get started
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center ${
                step >= 1 ? "text-indigo-600" : "text-slate-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
              </div>
              <span className="ml-2 font-medium">Business Info</span>
            </div>
            <div
              className={`w-16 h-1 rounded-full ${
                step >= 2 ? "bg-indigo-600" : "bg-slate-200"
              }`}
            ></div>
            <div
              className={`flex items-center ${
                step >= 2 ? "text-indigo-600" : "text-slate-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Account Setup</span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 hover-lift">
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-slate-900">
                    Business Information
                  </h2>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Agent Name"
                      name="agent"
                      type="text"
                      value={form.agent as string}
                      onChange={handleChange}
                      placeholder="Full name"
                      error={error && !form.agent ? "Required" : undefined}
                    />
                    <InputField
                      label="Phone 1"
                      name="phone1"
                      type="tel"
                      value={form.phone1 as string}
                      onChange={handleChange}
                      placeholder="+2348000000000"
                      error={error && !form.phone1 ? "Required" : undefined}
                    />
                    <InputField
                      label="Phone 2 (Optional)"
                      name="phone2"
                      type="tel"
                      value={form.phone2 as string}
                      onChange={handleChange}
                      placeholder="Secondary phone"
                    />
                    <InputField
                      label="Fax No (Optional)"
                      name="faxNo"
                      type="text"
                      value={form.faxNo as string}
                      onChange={handleChange}
                      placeholder="Fax number"
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <InputField
                        label="Address"
                        name="address"
                        type="text"
                        value={form.address as string}
                        onChange={handleChange}
                        placeholder="Street address"
                        error={error && !form.address ? "Required" : undefined}
                      />
                    </div>
                    <InputField
                      label="Area"
                      name="area"
                      type="text"
                      value={form.area as string}
                      onChange={handleChange}
                      placeholder="Area/District"
                      error={error && !form.area ? "Required" : undefined}
                    />
                    <InputField
                      label="City"
                      name="city"
                      type="text"
                      value={form.city as string}
                      onChange={handleChange}
                      placeholder="City"
                      error={error && !form.city ? "Required" : undefined}
                    />
                    <InputField
                      label="State"
                      name="state"
                      type="text"
                      value={form.state as string}
                      onChange={handleChange}
                      placeholder="State"
                      error={error && !form.state ? "Required" : undefined}
                    />
                  </div>
                </div>

                {/* Banking Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Banking Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Account Number"
                      name="accountNo"
                      type="text"
                      value={form.accountNo as string}
                      onChange={handleChange}
                      placeholder="Bank account number"
                      error={error && !form.accountNo ? "Required" : undefined}
                    />
                    <InputField
                      label="Bank Name"
                      name="bankname"
                      type="text"
                      value={form.bankname as string}
                      onChange={handleChange}
                      placeholder="e.g. GTBank"
                      error={error && !form.bankname ? "Required" : undefined}
                    />
                  </div>
                </div>

                {/* Additional Comments */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    name="remark"
                    value={form.remark as string}
                    onChange={handleChange}
                    placeholder="Any additional information..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* File Upload */}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-4">
                      <h3 className="font-semibold text-amber-900">
                        Required Documents
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <h4 className="font-medium text-amber-800 text-sm">
                            Identity Verification
                          </h4>
                          <ul className="space-y-1">
                            <li className="text-sm text-amber-700 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                              Valid ID (International Passport, Voter's Card, or
                              Driver's License)
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-amber-800 text-sm">
                            Residence Proof
                          </h4>
                          <ul className="space-y-1">
                            <li className="text-sm text-amber-700 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                              Utility Bill
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-amber-800 text-sm">
                            Personal
                          </h4>
                          <ul className="space-y-1">
                            <li className="text-sm text-amber-700 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                              Passport Photograph (white background)
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-amber-800 text-sm">
                            Education
                          </h4>
                          <ul className="space-y-1">
                            <li className="text-sm text-amber-700 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                              Proof of Education (Minimum OND/NCE)
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-amber-800 text-sm">
                            Guarantor
                          </h4>
                          <ul className="space-y-1">
                            <li className="text-sm text-amber-700 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                              Guarantor Criteria and Form (as per attached
                              sample)
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Form Download */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Guarantors Form Template
                        </p>
                        <p className="text-xs text-blue-600">
                          Download and fill out this required form
                        </p>
                      </div>
                    </div>
                    <a
                      href="\Guarantor_form.docx"
                      download="Guarantors_Form_Template.docx"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {/* Required Documents */}
                  </label>
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-slate-50/50"
                    onClick={() =>
                      document.getElementById("attachments")?.click()
                    }
                  >
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium mb-2">
                      Click to upload documents
                    </p>
                    <p className="text-sm text-slate-500">
                      {/* <p className="text-slate-500">Required Documents:</p> */}
                      {/* <p>
                        Valid ID (International Passport, Voter's Card, or
                        Driver's Licence)
                      </p>
                      <p>Utility Bill Passport Photograph (white background)</p>
                      <p>Proof of Education (Minimum OND/NCE)</p>
                      <p>Guarantor:</p>
                      Please find attached the Guarantor Criteria and sample
                      Guarantor Form you can incorporate, which are to be
                      included in the onboarding process. */}
                    </p>
                    <input
                      id="attachments"
                      name="attachments"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* File List */}
                  {form.attachments && form.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {form.attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-900 truncate">
                              {file.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {error &&
                    (!form.attachments || form.attachments.length === 0) && (
                      <p className="mt-2 text-sm text-red-600">
                        Please attach the required documents.
                      </p>
                    )}
                </div>

                <button
                  type="button"
                  onClick={next}
                  className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:from-indigo-700 hover:to-blue-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-slate-900">
                    Account Setup
                  </h2>
                </div>

                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email as string}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  error={error && !form.email ? "Required" : undefined}
                />

                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password as string}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                  error={error && !form.password ? "Required" : undefined}
                />

                {/* Cooperative Society Consent */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Shield className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-amber-900 mb-2">
                        Cooperative Society Membership and Contribution Consent
                      </h3>
                      <p className="text-sm text-amber-800 mb-3">
                        Membership in the{" "}
                        <strong>
                          Fortis Global Insurance Cooperative Society
                        </strong>{" "}
                        is compulsory for all agents.
                      </p>

                      {/* Read More Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowFullConsent(!showFullConsent)}
                        className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors mb-4"
                      >
                        <span>
                          {showFullConsent ? "Read Less" : "Read Full Terms"}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            showFullConsent ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Collapsible Content */}
                      {showFullConsent && (
                        <div className="text-sm text-amber-800 space-y-3 border-t border-amber-200 pt-4">
                          <p className="font-medium">
                            By signing this agreement, I consent to:
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>
                              Automatic enrolment into the Cooperative Society;
                            </li>
                            <li>
                              Monthly contributions of{" "}
                              <strong>₦5,000 – ₦15,000</strong> (depending on
                              cadre) to be deducted from my earnings;
                            </li>
                            <li>
                              Participation in the benefits and responsibilities
                              of the cooperative, including access to loans,
                              dividends, and savings.
                            </li>
                          </ul>
                          <p className="italic">
                            I understand that my membership helps to foster
                            financial growth, collaboration, and support among
                            colleagues.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="cooperativeConsent"
                      checked={cooperativeConsent}
                      onChange={(e) => setCooperativeConsent(e.target.checked)}
                      className="mt-1 w-5 h-5 text-amber-600 bg-white border-2 border-amber-300 rounded focus:ring-amber-500 focus:ring-2"
                    />
                    <label
                      htmlFor="cooperativeConsent"
                      className="text-sm font-medium text-amber-900 cursor-pointer"
                    >
                      I have read, understood, and consent to the Cooperative
                      Society membership terms and conditions outlined above. I
                      agree to the automatic deduction of monthly contributions
                      from my earnings.
                    </label>
                  </div>

                  {error && !cooperativeConsent && (
                    <p className="mt-3 text-sm text-red-600 font-medium flex items-center gap-2">
                      <X className="w-4 h-4" />
                      You must consent to the Cooperative Society membership to
                      proceed.
                    </p>
                  )}
                </div>

                {error &&
                  error !==
                    "You must consent to the Cooperative Society membership to proceed." && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-600 font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={back}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-200 ${
                      submitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:from-emerald-700 hover:to-green-700 hover:shadow-xl transform hover:-translate-y-0.5"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <CheckCircle className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentRegister;
