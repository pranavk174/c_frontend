export type ToastType =
    | "success"
    | "error"
    | "warning"
    | "missing"
    | "failed";

type ShowToastFn = (
    message: string,
    type?: ToastType
) => void;

let toastHandler: ShowToastFn | null = null;

export const registerToast = (
    fn: ShowToastFn
) => {
    toastHandler = fn;
};

export const showGlobalToast = (
    message: string,
    type: ToastType = "error"
) => {
    toastHandler?.(message, type);
};