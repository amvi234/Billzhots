// Cart API Mappers - services/cart/mapper.ts
import { ApiResponse } from "../types";

export const cartItemsResponseMapper = (response: ApiResponse): Array<any> => {
  if (response && response.data) {
    return response.data;
  }
  return [];
};

export const cartCountResponseMapper = (response: ApiResponse): { count: number } => {
  if (response && response.data && response.data.count !== undefined) {
    return { count: response.data.count };
  }
  return { count: 0 };
};

export const addToCartResponseMapper = (response: ApiResponse): any => {
  if (response && response.data) {
    return response.data;
  }
  return {};
};
