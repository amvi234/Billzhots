import api from "../api";
import { BillPayload, UploadBillResponse } from "./types";
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
    useMutation<ApiResponse<UploadBillResponse>, ApiErrorResponse, File>({
        mutationFn: async (file) => uploadBill(file),
    })
}
