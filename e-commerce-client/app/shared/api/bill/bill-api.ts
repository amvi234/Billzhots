import api from "../api";
import { BillIdPayload, BillPayload, UploadBillResponse } from "./types";
import { ApiErrorResponse, ApiResponse } from "../types";
import { UploadBillResponseMapper } from "./mapper";
import { useMutation } from "@tanstack/react-query";

export const uploadBill = async (
    file: File,
): Promise<ApiResponse<UploadBillResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<any, ApiResponse<UploadBillResponse>>('bill/upload/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
    res.data = UploadBillResponseMapper(res);
    return res;
}

export const useUploadBill = () => {
    return useMutation<ApiResponse<UploadBillResponse>, ApiErrorResponse, File>({
        mutationFn: async (file) => uploadBill(file),
    })
}

const deleteBillRequest = async (
    payload: BillIdPayload,
): Promise<ApiResponse> =>
    await api.delete(`/bill/${payload.billId}/`);

export const useDeleteBill = () =>
    useMutation<ApiResponse, ApiErrorResponse, BillIdPayload>({
        mutationFn: async (payload: BillIdPayload) =>
            deleteBillRequest(payload),
    })

// hooks for delete, download, list of bills and create google charts - 15 jun 25
