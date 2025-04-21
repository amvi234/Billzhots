import { localStorageManager } from "@/app/lib/utils";
import { ApiResponse } from "../types";
import { LoginResponse, VerifyOtpResponse } from "./types";

export const loginResponseMapper = (response: ApiResponse): LoginResponse => {
    const data = response.data || {};
    return {
      otp_secret: data.otp_secret || '',
      otp: data.otp || '',
      message: data.message || 'Enter OTP to continue'
    };
  };
  
  export const verifyOtpResponseMapper = (response: ApiResponse): VerifyOtpResponse => {
    const data = response.data || {};
    
    if (data.access) {
      localStorageManager.setToken(data.access);
    }
    
    if (data.refresh) {
      localStorageManager.setRefreshToken(data.refresh);
    }
    
    return {
      access_token: data.access || '',
      refresh_token: data.refresh || ''
    };
  };
  