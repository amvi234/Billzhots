import { ApiResponse } from "../types";
import { BillResponse } from "./types";

export const BillResponseMapper = (response: ApiResponse): BillResponse => {
    const data = response.data || {};
    return data;
}
