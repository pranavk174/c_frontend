import { Action, Middleware, isRejectedWithValue } from "@reduxjs/toolkit";

import { showGlobalToast } from "../toastservices";
import { logger } from "@/lib/utils";
import { useToast } from "@/components/Utility/Toast";

interface actionProps {
  payload: {
    status?: number | string;
    message?: string;
    data?: {
      message?: string;
      offline?: boolean;
    };
  };
}

interface metaProps {
  meta: {
    arg: unknown;
    requestId: string;
    requestStatus: "rejected";
    aborted: boolean;
    condition: boolean;
  } & (
    | {
      rejectedWithValue: true;
    }
    | ({
      rejectedWithValue: false;
    } & {})
  );
}

export const errorMiddleware: Middleware = () => (next) => (action) => {
  // const { showToast } = useToast()

  if (isRejectedWithValue(action)) {
    const payload = action.payload as {
      status?: number | string;
      message?: string;
      data?: {
        message?: string;
        offline?: boolean;
      };
    };

    // logger.log(payload, "payload dataaaa");

    // const endpointName = (action.meta)?.arg?.endpointName;



    if (payload.status === "FETCH_ERROR" || payload.data?.offline) {
      window.location.href = "/offline.html";
      return;
    }

    // logger.log("API:", endpointName);
    // showToast(message, "error");
  }

  return next(action);
};
