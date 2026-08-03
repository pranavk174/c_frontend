"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ArrowRight, ArrowLeft } from "lucide-react";
import { useLoginMutation, useVerifyOtpMutation } from "@/redux/Apis/Users";
import { getDeviceInfo } from "@/lib/utils";
import { addUser } from "@/redux/slices/User";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logger } from "@/lib/utils";
import { deviceConfig } from "@/lib/dummy";

export default function VerifyOtp({ email }: { email: string }) {
  const [step, setStep] = useState<"email" | "otp" | "profile">("email");
  const [data, setData] = useState<deviceConfig | undefined>(undefined);
  const [login, { isLoading: isLogging, isSuccess }] = useLoginMutation();
  const [otp, setOtp] = useState("");

  const dispatch = useDispatch();
  const [verifyOtp, { isLoading, isSuccess: isverifySuccess }] =
    useVerifyOtpMutation();
  const router = useRouter();


  useEffect(() => {
    const getData = async () => {
      const data = await getDeviceInfo();
      if (data) {


        setData(data)

      }
    }
    getData()
  }, [])

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      try {

        if (!data) return

        const { device_id, ip_address, location, device_name } = data;

        // logger.log(data, "dataaaaa");

        const verified = await verifyOtp({
          otp,
          email,
          device_id,
          ip_address,
          location: location?.city + "," + location?.country,
          device_name,
        }).unwrap();

        if (verified?.errors || verified?.verifyOtp?.success === false) {
          return;
        }

        if (verified.data.verifyOtp.data.is_verified) {
          router.push(
            `/login/verifyotp/${encodeURIComponent(email)}/create-profile`,
          );
          return;
        }

        if (document.cookie.includes("theme")) {
          const value = document.cookie.includes("dark") ? "dark" : "light";
          document.documentElement.classList.remove("dark", "light");
          document.documentElement.classList.add(value);
        }

        // dispatch(addUser(verified.data.verifyOtp.data));
        router.replace("/");
      } catch (error) {
        // logger.log(error?.data.errors[0].message, "errorrrr")
        // alert(error?.data.errors[0].message)
      }

      // Verify OTP here, then redirect or go to profile
      // window.location.href = "/";
    }
  };

  const resendOtp = async () => {
    try {
      await login({ email }).unwrap();
    } catch (error) {
      logger.log(error, "errorrrrrrr");
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
            {"Verify your email"}
          </h1>
        </div>

        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-6">
              Enter the 6-digit code sent to <br />
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                {email}
              </span>
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="--- ---"
              required
              className="w-full border-b-2 border-wa-primary bg-transparent text-center text-3xl tracking-widest py-2 focus:outline-none focus:border-wa-primary-dark dark:text-white"
            />
          </div>
          <div className="flex fap-x-3">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="flex-none bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 p-3 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={otp.length !== 6 || isLoading}
              className="flex-1 bg-wa-primary hover:bg-wa-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded transition-colors"
            >
              {isLoading ? "Verifying...." : "Verify"}
            </button>
          </div>
        </form>
        <button
          disabled={isLoading || isLogging}
          onClick={resendOtp}
          className=" bg-transparent cursor-pointer text-gray-200 disabled:text-gray-700  dark:hover:text-gray-500 font-semibold text-center w-full mt-4 "
        >



          {isLogging ? "Resending...." : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}
