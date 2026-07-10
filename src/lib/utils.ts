import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { socketResponse } from "./dummy";


type LogLevel = "log" | "info" | "warn" | "error" | "debug";

const isDev = process.env.NODE_ENV === "development";

function print(
  level: LogLevel,
  scope: string,
  ...args: unknown[]
) {
  if (!isDev && level !== "error") return;

  const time = new Date().toLocaleTimeString();

  console[level](
    `%c[${time}] [${scope}]`,
    "color:#3b82f6;font-weight:bold",
    ...args
  );
}

export const logger = {
  log: (scope: string, ...args: unknown[]) =>
    print("log", scope, ...args),

  info: (scope: string, ...args: unknown[]) =>
    print("info", scope, ...args),

  warn: (scope: string, ...args: unknown[]) =>
    print("warn", scope, ...args),

  error: (scope: string, ...args: unknown[]) =>
    print("error", scope, ...args),

  debug: (scope: string, ...args: unknown[]) =>
    print("debug", scope, ...args),
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
    console.log("IP fetch failed", error);
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

  console.log(splitted, "splitteddddd");
  return splitted;
};

export const socketCallback = (response: socketResponse) => {
  // agar backend fail
  if (!response.success) {
    // rollback
    // patchResult?.undo();

    console.log(response, "callback response");
  }
  console.log(response, "callback response outside");
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

    console.log(result, "res ponse upload....");

    return result.fileUrl;
  } catch (error) {
    return null;
  }
};



