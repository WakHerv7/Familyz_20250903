"use client";

import { useState } from "react";
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
import { useLogin } from "@/hooks/useAuth";
import { loginSchema, LoginFormData } from "@/schemas/auth";
import { ClipLoader } from "react-spinners";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

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

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    console.log("[LoginForm] onSubmit called with data:", data);
    loginMutation.mutate({
      emailOrPhone: data.emailOrPhone,
      password: data.password,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      {/* <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-gray-600">
          Sign in to your Family Tree account
        </CardDescription>
      </CardHeader> */}
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Login Method Selection */}
          <div className="space-y-3">
            {/* <Label className="text-sm font-medium text-gray-700">
              Login with
            </Label> */}
            <div className="flex gap-3">
              <label
                className={`flex items-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  loginMethod === "email"
                    ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-25"
                }`}
              >
                <input
                  type="radio"
                  checked={loginMethod === "email"}
                  onChange={() => {
                    setLoginMethod("email");
                    setValue("emailOrPhone", "");
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    loginMethod === "email"
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {loginMethod === "email" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-sm font-medium">Email</span>
              </label>
              <label
                className={`flex items-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  loginMethod === "phone"
                    ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-25"
                }`}
              >
                <input
                  type="radio"
                  checked={loginMethod === "phone"}
                  onChange={() => {
                    setLoginMethod("phone");
                    setValue("emailOrPhone", "");
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    loginMethod === "phone"
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {loginMethod === "phone" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-sm font-medium">Phone</span>
              </label>
            </div>
          </div>

          {/* Conditional Input Field */}
          <div className="space-y-2">
            <Label
              htmlFor="emailOrPhone"
              className="text-sm font-medium text-gray-700"
            >
              {loginMethod === "email" ? "Email Address" : "Phone Number"}
            </Label>
            {loginMethod === "email" ? (
              <Input
                id="emailOrPhone"
                type="email"
                {...register("emailOrPhone")}
                placeholder="your.email@example.com"
                className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            ) : (
              <div className="phoneInputCustomClass w-full px-3 py-2 border border-gray-300 rounded-md">
                <PhoneInput
                  value={watch("emailOrPhone") || ""}
                  onChange={(value) => setValue("emailOrPhone", value || "")}
                  defaultCountry="CM"
                  international
                  countryCallingCodeEditable={false}
                  className="w-full border-0"
                  placeholder="Enter phone number"
                />
              </div>
            )}
            {errors.emailOrPhone && (
              <p className="text-red-500 text-sm">
                {errors.emailOrPhone.message}
              </p>
            )}
          </div>

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
                placeholder="Enter your password"
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
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <ClipLoader size={16} color="white" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>

          {onSwitchToRegister && (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToRegister}
                className="text-sm text-green-600 hover:text-green-500"
              >
                Don't have an account? Sign up
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
