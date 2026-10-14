import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { socketResponse } from "./dummy";

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_NODE_ENV === "development";

/* eslint-disable no-console */

export const logger = {
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error("[ERROR]", ...args);
    }
    // Add error tracking service calls here (Sentry, etc.)
  },

  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn("[WARN]", ...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDev) {
      console.info("[INFO]", ...args);
    }
  },

  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug("[DEBUG]", ...args);
    }
  },
  dir: (...args: unknown[]) => {
    if (isDev) {
      console.dir("[DEBUG]", ...args);
    }
  },
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log("[log]", ...args);
    }
  },
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getDeviceInfo = async () => {
  let ip_address = null;
  let location = null;

  // Generate unique device id
  let device_id = localStorage.getItem("device_id");

  if (!device_id) {
    device_id = crypto.randomUUID();
    localStorage.setItem("device_id", device_id.slice(0, 20));
  }

  // Device / Browser Name
  const userAgent = navigator.userAgent;

  let browser = "Unknown Browser";

  if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  } else if (userAgent.includes("Edge")) {
    browser = "Edge";
  }

  const platform = navigator.platform;

  const device_name = `${browser} on ${platform}`;

  // Get IP + Location
  try {
    const res = await fetch("https://ipapi.co/json/");

    const data = await res.json();

    ip_address = data.ip;

    location = {
      city: data.city,
      region: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    logger.log("IP fetch failed", error);
  }

  return {
    device_id: device_id,
    ip_address,
    location,
    device_name,
  };
};

export const capitalizeWords = (word: string) => {
  if (!word) {
    return word;
  }
  const splitted = word
    .split(" ")
    .map((d) => d[0].toUpperCase().concat(d.substring(1)))
    .join(" ");

  logger.log(splitted, "splitteddddd");
  return splitted;
};

export const socketCallback = (response: socketResponse) => {
  // agar backend fail
  if (!response.success) {
    // rollback
    // patchResult?.undo();

    logger.log(response, "callback response");
  }
  logger.log(response, "callback response outside");
};

export const uploadImage = async (file: File) => {
  try {
    const form = new FormData();
    form.append("image", file);
    const data = await fetch("/api/upload/simpleUpload", {
      method: "POST",

      body: form,
    });

    const result = await data.json();

    logger.log(result, "res ponse upload....");

    return result.fileUrl;
  } catch (error) {
    return null;
  }
};

export const asyncHandler =
  <Args extends unknown[], R>(
    fn: (...args: Args) => Promise<R>,
    options?: {
      onError?: (error: unknown) => void;
      onFinally?: () => void;
    },
  ) =>
  async (...args: Args): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      options?.onError?.(error);
      logger.debug("async handler error", error);
      return undefined;
    } finally {
      options?.onFinally?.();
    }
  };
