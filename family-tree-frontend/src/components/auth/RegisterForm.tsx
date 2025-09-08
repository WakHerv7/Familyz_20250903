"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegister } from "@/hooks/useAuth";
import { registerSchema, RegisterFormData } from "@/schemas/auth";
import { Gender, RegistrationType } from "@/types";
import { ClipLoader } from "react-spinners";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Custom styles for PhoneInput
const phoneInputStyles = `
  .phoneInputCustomClass input {
    border: none !important;
    outline: none !important;
    background: transparent !important;
    font-size: 14px !important;
    width: 100% !important;
    padding: 0 !important;
  }

  .phoneInputCustomClass .PhoneInputCountry {
    margin-right: 8px;
  }

  .phoneInputCustomClass .PhoneInputCountrySelect {
    border: none !important;
    background: transparent !important;
  }

  .phoneInputCustomClass .PhoneInputCountrySelectArrow {
    border-top-color: #6b7280 !important;
  }

  .phoneInputCustomClass:focus-within {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 1px #10b981 !important;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = phoneInputStyles;
  document.head.appendChild(styleSheet);
}

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onStepChange?: (step: number) => void;
}

export default function RegisterForm({
  onSwitchToLogin,
  onStepChange,
}: RegisterFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();

  // Call onStepChange when step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      registrationType: RegistrationType.CREATE_FAMILY,
      gender: Gender.PREFER_NOT_TO_SAY,
    },
  });

  const registrationType = watch("registrationType");

  const onSubmit = (data: RegisterFormData) => {
    // Clean up the data based on registration type
    const submitData = {
      ...data,
      ...(data.email === "" && { email: undefined }),
      ...(data.phone === "" && { phone: undefined }),
    };

    registerMutation.mutate(submitData);
  };

  const nextStep = async () => {
    // Step 1 is just choosing registration type, no validation needed
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      // Step 2 validation
      const fieldsToValidate = [
        "email",
        "name",
        "password",
        "confirmPassword",
        "gender",
      ];
      if (registrationType === RegistrationType.CREATE_FAMILY) {
        fieldsToValidate.push("familyName");
      } else if (registrationType === RegistrationType.JOIN_FAMILY) {
        fieldsToValidate.push("invitationCode");
      }
      const isValid = await trigger(
        fieldsToValidate as (keyof RegisterFormData)[]
      );
      if (isValid) {
        setCurrentStep(3);
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      {/* <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-gray-900">
          {currentStep === 1
            ? "How would you like to get started?"
            : "Create Account"}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {currentStep === 1
            ? "Choose whether to create a new family tree or join an existing one"
            : ""}
        </CardDescription>

        <div className="flex items-center justify-center mt-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`w-8 h-1 ${
                currentStep >= 2 ? "bg-green-500" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-sm text-gray-600">
            Step {currentStep} of 2:{" "}
            {currentStep === 1 ? "Choose Your Path" : "Account Details"}
          </p>
        </div>
      </CardHeader> */}
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 1 && (
            <>
              {/* Step 1: Choose Family Path */}
              <div className="space-y-6">
                {/* <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How would you like to get started?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Choose whether to create a new family tree or join an
                    existing one
                  </p>
                </div> */}

                <div className="grid grid-cols-1 gap-4">
                  {/* Create Family Button - Redesigned */}
                  <Button
                    type="button"
                    onClick={() => {
                      setValue(
                        "registrationType",
                        RegistrationType.CREATE_FAMILY
                      );
                      nextStep();
                    }}
                    className={`relative h-auto p-6 border-2 transition-all duration-300 group ${
                      registrationType === RegistrationType.CREATE_FAMILY
                        ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 shadow-lg"
                        : "border-gray-200 bg-white hover:bg-[#F9F9F9] hover:border-green-300 hover:shadow-md text-gray-700"
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          registrationType === RegistrationType.CREATE_FAMILY
                            ? "bg-green-500 text-white"
                            : "bg-green-100 text-green-600 group-hover:bg-green-200"
                        }`}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-lg mb-1 group-hover:text-green-800">
                          Create New Family
                        </div>
                        <div
                          className={`text-sm group-hover:text-green-700 ${
                            registrationType === RegistrationType.CREATE_FAMILY
                              ? "text-green-700"
                              : "text-gray-600"
                          }`}
                        >
                          Start your own family tree and invite others to join
                        </div>
                      </div>
                    </div>
                  </Button>

                  {/* Join Family Button - Redesigned */}
                  <Button
                    type="button"
                    onClick={() => {
                      setValue(
                        "registrationType",
                        RegistrationType.JOIN_FAMILY
                      );
                      nextStep();
                    }}
                    className={` h-auto p-6 border-2 transition-all duration-300 group ${
                      registrationType === RegistrationType.JOIN_FAMILY
                        ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 shadow-lg"
                        : "border-gray-200 bg-white hover:bg-[#F9F9F9] hover:border-green-300 hover:shadow-md text-gray-700"
                    }`}
                  >
                    <div className="px-10 flex items-start space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 
                          ${
                            registrationType === RegistrationType.JOIN_FAMILY
                              ? "bg-green-500 text-white"
                              : "bg-green-100 text-green-600 group-hover:bg-green-200"
                          }`}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-lg mb-1 group-hover:text-green-800">
                          Join Existing Family
                        </div>
                        <div
                          className={`text-sm text-gray-600 group-hover:text-green-700`}
                        >
                          Connect with your family using an invitation code
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Step 2: Account Details */}
              <div className="w-[600px] grid grid-cols-1  md:grid-cols-2  gap-10">
                {/* Email */}
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="your.email@example.com"
                      className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      {...register("name")}
                      placeholder="Your full name"
                      className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        placeholder="Create a secure password"
                        className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <FaEyeSlash className="h-5 w-5" />
                        ) : (
                          <FaEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        {...register("confirmPassword")}
                        placeholder="Confirm your password"
                        className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="h-5 w-5" />
                        ) : (
                          <FaEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  {/* <div className="space-y-2">
                    <Label
                      htmlFor="gender"
                      className="text-sm font-medium text-gray-700"
                    >
                      Gender
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("gender", value as Gender)
                      }
                      defaultValue={Gender.PREFER_NOT_TO_SAY}
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Gender.PREFER_NOT_TO_SAY}>
                          Prefer not to say
                        </SelectItem>
                        <SelectItem value={Gender.MALE}>Male</SelectItem>
                        <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                        <SelectItem value={Gender.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-red-500 text-xs">
                        {errors.gender.message}
                      </p>
                    )}
                  </div> */}
                </div>
                <div className="space-y-2">
                  {/* Family-specific fields */}
                  {registrationType === RegistrationType.CREATE_FAMILY && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="familyName"
                          className="text-sm font-medium text-gray-700"
                        >
                          Family Name
                        </Label>
                        <Input
                          id="familyName"
                          type="text"
                          {...register("familyName")}
                          placeholder="e.g., The Smith Family"
                          className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                        {errors.familyName && (
                          <p className="text-red-500 text-xs">
                            {errors.familyName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="familyDescription"
                          className="text-sm font-medium text-gray-700"
                        >
                          Family Description (Optional)
                        </Label>
                        <Input
                          id="familyDescription"
                          type="text"
                          {...register("familyDescription")}
                          placeholder="Brief description of your family"
                          className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                        {errors.familyDescription && (
                          <p className="text-red-500 text-xs">
                            {errors.familyDescription.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {registrationType === RegistrationType.JOIN_FAMILY && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="invitationCode"
                        className="text-sm font-medium text-gray-700"
                      >
                        Invitation Code
                      </Label>
                      <Input
                        id="invitationCode"
                        type="text"
                        {...register("invitationCode")}
                        placeholder="Enter invitation code"
                        className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                      {errors.invitationCode && (
                        <p className="text-red-500 text-xs">
                          {errors.invitationCode.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Phone (optional) */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium text-gray-700"
                    >
                      Phone Number
                    </Label>
                    <div className="phoneInputCustomClass w-full px-3 py-2 border border-gray-300 rounded-md">
                      <PhoneInput
                        value={watch("phone") || ""}
                        onChange={(value) => setValue("phone", value || "")}
                        defaultCountry="CM"
                        international
                        countryCallingCodeEditable={false}
                        className="w-full border-0"
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-10">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1 h-11 border-gray-300 hover:border-green-300 text-gray-700"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <ClipLoader size={16} color="white" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
