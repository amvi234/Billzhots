import { useMutation } from "@tanstack/react-query";
import api from "../api";
import { ApiErrorResponse, ApiResponse } from "../types";
import { loginResponseMapper, verifyOtpResponseMapper } from "./mapper";
import { LoginPayload, LoginResponse, VerifyOtpPayload, VerifyOtpResponse } from "./types";

export const verifyOtpRequest = async (
    payload: VerifyOtpPayload,
): Promise<ApiResponse<VerifyOtpResponse>> => {
    const res = await api.post<any, ApiResponse>('auth/verify_otp/', payload);
    res.data = verifyOtpResponseMapper(res)
    return res;
}

export const loginRequest = async (
    payload: LoginPayload,
): Promise<ApiResponse<LoginResponse>> => {
    const res = await api.post<any, ApiResponse>('auth/login/', payload);
    res.data = loginResponseMapper(res)
    return res;
}

export const useLoginRequest = () =>
    useMutation<ApiResponse<LoginResponse>, ApiErrorResponse, any>({
        mutationFn: async (payload: LoginPayload) => loginRequest(payload),
    });

export const useVerifyOtpRequest = () =>
    useMutation<ApiResponse<VerifyOtpResponse>, ApiErrorResponse, any>({
        mutationFn: async (payload: VerifyOtpPayload) => verifyOtpRequest(payload),
    })
