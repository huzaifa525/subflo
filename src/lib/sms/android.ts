// Android SMS Receiver API integration
// This runs client-side in the PWA on Android devices

export function isSMSApiSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "sms" in navigator || "NDEFReader" in window;
}

// Client-side function to request SMS permission and read messages
// Note: Web SMS API has limited support, primarily works on Android Chrome
export async function requestSMSPermission(): Promise<boolean> {
  try {
    // The Web OTP API can receive SMS on Android
    if ("OTPCredential" in window) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// For now, the primary Android SMS flow is:
// 1. User shares/forwards SMS to the app
// 2. Or pastes SMS text manually
// 3. The SMS text is sent to /api/sms/parse for LLM extraction
//
// Future: Native Android wrapper can use SmsRetriever API
// or ContentResolver to read SMS with proper permissions

export interface SMSShareData {
  text: string;
  title?: string;
}

export function canReceiveSharedText(): boolean {
  if (typeof navigator === "undefined") return false;
  return "share" in navigator;
}

// Register as a share target in the PWA manifest
// This allows users to share SMS directly to Subflo
export const SHARE_TARGET_CONFIG = {
  action: "/api/sms/share",
  method: "POST",
  enctype: "application/x-www-form-urlencoded",
  params: {
    title: "title",
    text: "text",
    url: "url",
  },
};
