// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Label } from "../UI/label";
import { Input } from "../UI/new-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../UI/new-select";
import { Popover, PopoverContent, PopoverTrigger } from "../UI/popover";
import { Button } from "../UI/new-button";
import { CalendarIcon, Upload, User, CheckCircle } from "lucide-react";
import { cn } from "../../utils/class-names";
import { DOBCalendar } from "../UI/calendar";
import { format } from "date-fns";
import { Textarea } from "../UI/textarea";
import { useToast } from "../UI/use-toast";
import {
  createBeneficiary,
  clearMessages,
  resetCreateSuccess,
  selectBeneficiaries,
} from "../../features/reducers/beneficiariesReducers/beneficiariesSlice";
import type { AppDispatch, RootState } from "../../features/store";
import type { BeneficiaryFormData } from "../../types/beneficiaries";

const initialBeneficiaryState: BeneficiaryFormData = {
  surname: "",
  otherNames: "",
  address: "",
  sex: "",
  dateOfBirth: undefined,
  age: 0,
  relationship: "",
  percentage: 0.01,
  beneficiaryType: "PRIMARY",
};

interface CreateBeneficiaryFormProps {
  onSubmit?: (data: BeneficiaryFormData) => void;
  onCancel: () => void;
  policyNo?: string;
  proposalNo?: string;
  onSuccess?: () => void;
}

const CreateBeneficiaryForm: React.FC<CreateBeneficiaryFormProps> = ({
  onSubmit,
  onCancel,
  policyNo,
  proposalNo,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const { loading, error, success } = useSelector(selectBeneficiaries);

  const [form, setForm] = useState<BeneficiaryFormData>({
    ...initialBeneficiaryState,
    ...(policyNo && { policyNo }),
    ...(proposalNo && { proposalNo }),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to handle success state - FIXED
  useEffect(() => {
    if (success.createBeneficiary) {
      // Show success toast with proposal number
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Success!</span>
          </div>
        ),
        description: `Beneficiary added successfully to Proposal: ${proposalNo}`,
        variant: "success",
        duration: 5000,
      });

      // COMPLETELY reset the form while keeping proposalNo
      setForm({
        ...initialBeneficiaryState,
        ...(policyNo && { policyNo }),
        ...(proposalNo && { proposalNo }), // Keep the proposal number
      });

      // Clear any errors
      setErrors({});

      dispatch(resetCreateSuccess());
      setIsSubmitting(false);

      // Call parent's onSubmit callback to refresh the list and close the form
      if (onSubmit) {
        onSubmit(form);
      }

      // Optional: Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [
    success.createBeneficiary,
    dispatch,
    policyNo,
    proposalNo,
    toast,
    onSuccess,
    onSubmit,
    form,
  ]);

  // Effect to handle errors
  useEffect(() => {
    if (error.createBeneficiary) {
      console.error("❌ Error creating beneficiary:", error.createBeneficiary);

      toast({
        title: "Error",
        description: error.createBeneficiary,
        variant: "destructive",
        duration: 5000,
      });

      dispatch(clearMessages());
      setIsSubmitting(false);
    }
  }, [error.createBeneficiary, dispatch, toast]);

  const handleChange = (field: keyof BeneficiaryFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    handleChange(
      name as keyof BeneficiaryFormData,
      type === "number" ? Number(value) : value
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleChange("photo", file);
  };

  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  };

  const handleDateChange = (date: Date | undefined) => {
    handleChange("dateOfBirth", date);
    if (date) {
      const age = calculateAge(date);
      handleChange("age", age);
    } else {
      handleChange("age", 0);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.surname.trim()) newErrors.surname = "Surname is required";
    if (!form.otherNames.trim())
      newErrors.otherNames = "Other names are required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.sex) newErrors.sex = "Sex is required";
    if (!form.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!form.relationship) newErrors.relationship = "Relationship is required";
    if (!form.percentage || form.percentage <= 0)
      newErrors.percentage = "Percentage must be greater than 0";
    if (form.percentage > 100)
      newErrors.percentage = "Percentage cannot exceed 100";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Enhanced handleSubmit with proper data preparation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate form fields
    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert photo to Base64 if it exists
      let photoBase64 = "";
      if (form.photo instanceof File) {
        const reader = new FileReader();
        photoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64String = result.split(",")[1] || "";
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(form.photo as File);
        });
      }

      // Format DOB as MM-dd-yyyy (API format)
      let formattedDob = "";
      if (form.dateOfBirth) {
        const dob = form.dateOfBirth;
        formattedDob = `${(dob.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${dob
          .getDate()
          .toString()
          .padStart(2, "0")}-${dob.getFullYear()}`;
      }

      // Prepare data exactly as the API expects
      const submissionData = {
        ProposalNo: proposalNo || "",
        Surname: form.surname.trim(),
        OtherNames: form.otherNames.trim(),
        Age: form.age.toString(), // API expects string
        Sex: form.sex,
        DOB: formattedDob, // Changed to MM-dd-yyyy format
        Relation: form.relationship,
        Percentage: form.percentage.toString(), // Convert to string for FormData
        Type: form.beneficiaryType, // e.g., "PRIMARY" or "CONTINGENT"
        TransFlag: "N", // Default for new records
        Photo: null, // API expects binary string here, usually null if sending Base64
        PhotoBase64: photoBase64,
        PolicyNo: policyNo || "N/A", // Use "N/A" as placeholder since this is for a proposal, not a policy
        Address: form.address.trim(),
        Remark: form.remark || "",
        Tag: form.tag || "B", // Default tag if not provided
      };

      console.log("📤 Submitting beneficiary data:", submissionData);
      console.log("📤 ProposalNo:", proposalNo);
      console.log("📤 All form values:", form);

      await dispatch(
        createBeneficiary({
          formData: submissionData, // Pass the correctly mapped data
          policyNo,
          proposalNo,
        })
      ).unwrap();

      // Success is handled in useEffect above
      // Don't call onCancel here to stay on the same page
    } catch (error) {
      console.error("Failed to create beneficiary:", error);
      setIsSubmitting(false);
    }
  };

  const relationshipOptions = [
    "FATHER",
    "MOTHER",
    "SON",
    "DAUGHTER",
    "BROTHER",
    "SISTER",
    "COUSIN",
    "UNCLE",
    "NEPHEW",
    "RELATION",
    "WIFE",
    "HUSBAND",
    "FATHER-IN-LAW",
    "MOTHER-IN-LAW",
    "FRIENDS",
    "CREDIT INTEREST",
    "NIECE",
    "AUNT",
    "GRANDDAUGHTER",
    "GRANDSON",
    "GRANDPA",
    "FIANCE",
  ];

  return (
    <div className="space-y-9 p-6 bg-white ">
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-6">
        <User className="h-12 w-12 text-primary-blue mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">
          Add New Beneficiary
        </h2>
        <p className="text-gray-600 mt-2">
          Complete all required fields to add a beneficiary
        </p>

        {/* Show linked policy/proposal info */}
        {(policyNo || proposalNo) && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              This beneficiary will be linked to:{" "}
              {policyNo && `Policy: ${policyNo}`}
              {policyNo && proposalNo && " • "}
              {proposalNo && `Proposal: ${proposalNo}`}
            </p>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="surname"
                className="text-sm font-semibold text-gray-700"
              >
                Surname *
              </Label>
              <Input
                id="surname"
                name="surname"
                value={form.surname}
                onChange={handleInputChange}
                placeholder="Enter surname"
                className="w-full transition-colors focus:border-primary-blue"
              />
              {errors.surname && (
                <p className="text-sm text-red-500 mt-1">{errors.surname}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="otherNames"
                className="text-sm font-semibold text-gray-700"
              >
                Other Names *
              </Label>
              <Input
                id="otherNames"
                name="otherNames"
                value={form.otherNames}
                onChange={handleInputChange}
                placeholder="Enter other names"
                className="w-full transition-colors focus:border-primary-blue"
              />
              {errors.otherNames && (
                <p className="text-sm text-red-500 mt-1">{errors.otherNames}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="sex"
                className="text-sm font-semibold text-gray-700"
              >
                Sex *
              </Label>
              <Select
                value={form.sex}
                onValueChange={(value) => handleChange("sex", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.sex && (
                <p className="text-sm text-red-500 mt-1">{errors.sex}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="relationship"
                className="text-sm font-semibold text-gray-700"
              >
                Relationship *
              </Label>
              <Select
                value={form.relationship}
                onValueChange={(value) => handleChange("relationship", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {relationshipOptions.map((relationship) => (
                    <SelectItem key={relationship} value={relationship}>
                      {relationship}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.relationship && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.relationship}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="dateOfBirth"
                  className="text-sm font-semibold text-gray-700"
                >
                  Date of Birth *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.dateOfBirth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.dateOfBirth
                        ? format(form.dateOfBirth, "MM/dd/yyyy")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DOBCalendar
                      value={form.dateOfBirth}
                      onChange={handleDateChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="age"
                  className="text-sm font-semibold text-gray-700"
                >
                  Age
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleInputChange}
                  placeholder="Auto-calculated"
                  className="w-full bg-gray-50"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="beneficiaryType"
                className="text-sm font-semibold text-gray-700"
              >
                Beneficiary Type *
              </Label>
              <Select
                value={form.beneficiaryType}
                onValueChange={(value) =>
                  handleChange("beneficiaryType", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIMARY">PRIMARY</SelectItem>
                  <SelectItem value="CONTINGENT">CONTINGENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Percentage & Address Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="percentage"
              className="text-sm font-semibold text-gray-700"
            >
              Percentage (%) *
            </Label>
            <Input
              id="percentage"
              name="percentage"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={form.percentage === 0 ? "0.01" : form.percentage}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  handleChange("percentage", 0.01);
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0.01 && numValue <= 100) {
                    handleChange("percentage", numValue);
                  } else if (numValue < 0.01) {
                    handleChange("percentage", 0.01);
                  } else if (numValue > 100) {
                    handleChange("percentage", 100);
                  }
                }
              }}
              placeholder="Enter percentage"
              className="w-full transition-colors focus:border-primary-blue"
            />
            {errors.percentage && (
              <p className="text-sm text-red-500 mt-1">{errors.percentage}</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label
              htmlFor="address"
              className="text-sm font-semibold text-gray-700"
            >
              Address *
            </Label>
            <Textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleInputChange}
              placeholder="Enter complete address"
              rows={3}
              className="w-full resize-none transition-colors focus:border-primary-blue"
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address}</p>
            )}
          </div>
        </div>

        {/* Optional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="remark"
              className="text-sm font-semibold text-gray-700"
            >
              Remark
            </Label>
            <Input
              id="remark"
              name="remark"
              value={form.remark || ""}
              onChange={handleInputChange}
              placeholder="Enter remarks (optional)"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="tag"
              className="text-sm font-semibold text-gray-700"
            >
              Tag
            </Label>
            <Input
              id="tag"
              name="tag"
              value={form.tag || ""}
              onChange={handleInputChange}
              placeholder="Enter tag (optional)"
              className="w-full"
            />
          </div>
        </div>

        {/* Photo Upload Section */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="h-6 w-6 text-primary-blue" />
            <h3 className="text-lg font-semibold text-gray-900">
              Photo Upload
            </h3>
          </div>
          <div className="space-y-3">
            <Label
              htmlFor="photo"
              className="text-sm font-semibold text-gray-700"
            >
              Upload Beneficiary Photo (Optional)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: JPG, PNG, GIF. Maximum file size: 5MB
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-w-24 px-6 py-2"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary-blue hover:bg-primary-blue/90 min-w-24 px-6 py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </div>
            ) : (
              "Add Beneficiary"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateBeneficiaryForm;
