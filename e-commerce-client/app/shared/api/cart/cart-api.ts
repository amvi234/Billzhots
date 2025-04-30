import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../api";
import { ApiErrorResponse, ApiResponse } from "../types";
import { AddToCartPayload, CartCountResponse, CartItem, GenerateRequestPayload } from './types';
import { addToCartResponseMapper, cartCountResponseMapper, cartItemsResponseMapper } from './mapper';

export const generateReportRequest = async (
  payload: GenerateRequestPayload
): Promise<ApiResponse<{}>> => {
  const res = await api.post<any, ApiResponse>('cart/generate_report/', payload);
  return res;
}

export const addToCartRequest = async (
  payload: AddToCartPayload
): Promise<ApiResponse<CartItem>> => {
  const res = await api.post<any, ApiResponse>('cart/', payload);
  res.data = addToCartResponseMapper(res);
  return res;
};

export const getCartCountRequest = async (): Promise<ApiResponse<CartCountResponse>> => {
  const res = await api.get<any, ApiResponse>('cart/count/');
  res.data = cartCountResponseMapper(res);
  return res;
};

export const useGenerateReportRequest = () =>
  useMutation<ApiResponse<{}>, ApiErrorResponse, any>({
    mutationFn: async (payload: GenerateRequestPayload) => generateReportRequest(payload),
  });

export const useCartCount = () =>
  useQuery({
    queryKey: ['cartCount'],
    queryFn: getCartCountRequest,
  });

export const useAddToCart = () =>
  useMutation<ApiResponse<CartItem>, ApiErrorResponse, any>({
    mutationFn: async (payload: AddToCartPayload) => addToCartRequest(payload),
  });

