import api from "../api";
import { BillPayload } from "./types";
import { ApiErrorResponse, ApiResponse } from "../types";
import { BillResponseMapper } from "./mapper";
import { useMutation } from "@tanstack/react-query";

export const uploadBill = async (
    payload: BillPayload,
): Promise<ApiResponse<{}>> => {
    const res = await api.post<any, ApiResponse>('bill/', payload);
    res.data = BillResponseMapper(res)
    return res;
}
export const useUploadBill = () => {
    useMutation<ApiResponse<{}>, ApiErrorResponse, any>({
        mutationFn: async (payload: BillPayload) => uploadBill(payload),
    })
}
