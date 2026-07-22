import { Action, Middleware, isRejectedWithValue } from "@reduxjs/toolkit";

import { showGlobalToast } from "../toastservices";

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

    console.log(payload, "payload dataaaa");

    // const endpointName = (action.meta)?.arg?.endpointName;

    const message =
      payload.message ?? payload.data?.message ?? "Something went wrong";

    if (payload.status === "FETCH_ERROR" || payload.data?.offline) {
      window.location.href = "/offline.html";
      return;
    }

    // console.log("API:", endpointName);
    // showToast(message, "error");
    // showGlobalToast(`error in ${endpointName} API`, "error");
  }

  return next(action);
};
