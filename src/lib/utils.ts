import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
