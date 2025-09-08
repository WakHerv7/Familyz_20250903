"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);

  // Update document title based on current step
  useEffect(() => {
    const titles = {
      1: "How would you like to get started? | Family Tree",
      2: "Create Account | Family Tree",
    };
    document.title =
      titles[currentStep as keyof typeof titles] || "Signup | Family Tree";
  }, [currentStep]);

  // Handle step changes from RegisterForm
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-fit">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 1
              ? "How would you like to get started?"
              : "Register your informations"}
          </h1>
          <p className="text-gray-600">
            {currentStep === 1
              ? "Choose whether to create a new family tree or join an existing one"
              : ""}
          </p>
        </div>
        <RegisterForm onStepChange={handleStepChange} />
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-green-600 hover:text-green-500 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
