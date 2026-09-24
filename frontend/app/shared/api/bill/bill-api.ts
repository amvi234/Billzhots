import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../api";
import { ApiErrorResponse, ApiResponse } from "../types";
import { BillIdPayload, BillPayload, BillProcessingStatus, CategoryDistributionEntry, TotalAmountResponse, UploadBillResponse } from "./types";
import { UploadBillResponseMapper } from "./mapper";

const POLL_INTERVAL_MS = 3000;

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

export const downloadBillRequest = async (payload: BillIdPayload): Promise<any> => {
    const res = await api.get<Blob>(`/bill/${payload.billId}/`, {
        responseType: 'blob',
    });
    return res;
};

export const useDownloadBill = () => {
    return useMutation<any, Error, BillIdPayload>({
        mutationFn: downloadBillRequest,
    })
}

export const listBillsRequest = async (): Promise<BillPayload[]> => {
    const res = await api.get<any, ApiResponse<BillPayload[]>>('/bill/');
    return res.data;
}


const hasBillsInFlight = (bills?: BillPayload[]) =>
    (bills ?? []).some(
        (bill) =>
            bill.processing_status === BillProcessingStatus.Pending ||
            bill.processing_status === BillProcessingStatus.Processing,
    );

export const useListBills = () =>
    useQuery<BillPayload[]>({
        queryKey: ["bills"],
        queryFn: listBillsRequest,
        // Extraction runs on a Celery worker, so poll until every bill settles.
        refetchInterval: (query) =>
            hasBillsInFlight(query.state.data) ? POLL_INTERVAL_MS : false,
        staleTime: 0,
    })

export const getCategoryDistributionRequest = async (): Promise<CategoryDistributionEntry[]> => {
    const res = await api.get<any, ApiResponse<CategoryDistributionEntry[]>>('/bill/category_distribution/');
    return res.data;
}

export const useGetCategoryDistribution = (enabled: boolean) =>
    useQuery<CategoryDistributionEntry[]>({
        queryKey: ["category-distribution"],
        queryFn: getCategoryDistributionRequest,
        enabled,
        staleTime: 0,
    })
export const getTotalAmountRequest = async (): Promise<TotalAmountResponse> => {
    const res = await api.get<any, ApiResponse<TotalAmountResponse>>('/bill/total_amount/');
    return res.data;
    }
export const useGetTotalAmount = () =>
    useQuery<TotalAmountResponse>({
    queryKey: ["total-amount"],
    queryFn: getTotalAmountRequest,
    enabled: false, // Only fetch when explicitly called
    staleTime: 0,
    })
