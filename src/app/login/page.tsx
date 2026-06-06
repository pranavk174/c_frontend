"use client";

import { useState } from "react";
import { MessageSquare, ArrowRight, ArrowLeft } from "lucide-react";
import { useLoginMutation, useVerifyOtpMutation } from "@/redux/Apis/Users";
import { getDeviceInfo } from "@/lib/utils";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const [step, setStep] = useState<"email" | "otp" | "profile">("email");
  const [email, setEmail] = useState("");

  const [login, { isLoading: isLogging, isSuccess }] = useLoginMutation();
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // In a real app, send OTP to email here

      try {
        const data = await login({ email }).unwrap();
        // if (data.success === true) {
        setStep("otp");
        router.push(`/login/verifyotp/${encodeURIComponent(email)}`);
        // }
      } catch (error) {
        console.log(error, "error dataaa");
      }
    }
  };

  return (
    <div className="min-h-screen bg-wa-bg dark:bg-wa-bg-dark flex items-center justify-center p-4">
      {/* WhatsApp Green Top Bar Background */}
      <div className="absolute top-0 left-0 w-full h-[222px] bg-wa-primary dark:bg-wa-primary-dark hidden md:block z-0"></div>

      <div className="bg-wa-panel dark:bg-wa-panel-dark w-full max-w-md rounded-lg shadow-lg overflow-hidden relative z-10 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 bg-wa-primary dark:bg-wa-primary-dark rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-light text-gray-800 dark:text-gray-100">
            {step === "email" && "Welcome to WhatsApp Clone"}
          </h1>
        </div>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-6">
                Enter your email address to receive an OTP and sign in.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full border-b-2 border-wa-primary bg-transparent text-center text-lg py-2 focus:outline-none focus:border-wa-primary-dark dark:text-white"
              />
            </div>
            <button
              disabled={isLogging}
              type="submit"
              className="w-full bg-wa-primary hover:bg-wa-primary-dark text-white font-medium py-3 rounded flex items-center justify-center transition-colors"
            >
              {isLogging ? "Loading...." : "Next"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
