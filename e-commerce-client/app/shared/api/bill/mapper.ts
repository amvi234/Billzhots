import { ApiResponse } from "../types";
import { UploadBillResponse } from "./types";

export const UploadBillResponseMapper = (response: ApiResponse): UploadBillResponse => {
    const data = response.data || {};
    return data;
}
