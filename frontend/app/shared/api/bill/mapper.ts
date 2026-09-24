import { ApiResponse } from "../types";
import { BillPayload, UploadBillResponse } from "./types";

export const UploadBillResponseMapper = (response: ApiResponse): UploadBillResponse => {
    const data = response.data || {};
    return data;
}
export const listBillResponseMapper = (response: ApiResponse): BillPayload[] => {
    const data = response.data || {};
    return data;
}
