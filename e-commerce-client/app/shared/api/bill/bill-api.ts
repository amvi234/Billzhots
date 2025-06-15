import api from "../api";
import { BillIdPayload, BillPayload, UploadBillResponse } from "./types";
import { ApiErrorResponse, ApiResponse } from "../types";
import { UploadBillResponseMapper } from "./mapper";
import { useMutation, useQuery } from "@tanstack/react-query";

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

export const downloadBillRequest = async (payload: BillIdPayload): Promise<Blob> => {
    const res = await api.get<Blob>(`/bill/${payload.billId}/`, {
        responseType: 'blob',
    });
    return res.data;
};

export const useDownloadBill = () => {
    return useMutation<Blob, Error, BillIdPayload>({
        mutationFn: downloadBillRequest,
    })
}

export const listBillsRequest = async (): Promise<ApiResponse<BillPayload[]>> => {
    const res = await api.get<ApiResponse<BillPayload[]>>('/bill/');
    return res.data;
}

export const useListBills = () =>
    useQuery<ApiResponse<BillPayload[]>>({
        queryKey: ["bills"],
        queryFn: listBillsRequest,
    })
