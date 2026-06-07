
import { Middleware, isRejectedWithValue } from "@reduxjs/toolkit";
import { showGlobalToast } from "../toastservices";

export const errorMiddleware: Middleware =
    () => (next) => (action) => {




        // const { showToast } = useToast()
        if (isRejectedWithValue(action)) {
            console.log(action, "action meta daata...")
            const endpointName =
                (action.meta as any)?.arg?.endpointName;

            const message =
                (action.payload as any)?.message ||
                (action.payload as any)?.data?.message ||
                "Something went wrong";

            console.log("API:", endpointName);
            // showToast(message, "error");
            showGlobalToast(`error in ${endpointName} API`, "error");
        }

        return next(action);
    };