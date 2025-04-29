import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../api";
import { ApiErrorResponse, ApiResponse } from "../types";
import { AddToCartPayload, CartCountResponse, CartItem } from './types';
import { addToCartResponseMapper, cartCountResponseMapper, cartItemsResponseMapper } from './mapper';

// Fetch all cart items
export const fetchCartItems = async (): Promise<ApiResponse<CartItem[]>> => {
  const res = await api.get<any, ApiResponse>('cart/');
  res.data = cartItemsResponseMapper(res);
  return res;
};

// Add item to cart
export const addToCartRequest = async (
  payload: AddToCartPayload
): Promise<ApiResponse<CartItem>> => {
  const res = await api.post<any, ApiResponse>('cart/', payload);
  res.data = addToCartResponseMapper(res);
  return res;
};

// Delete cart item
export const deleteCartItemRequest = async (
  itemId: string
): Promise<ApiResponse<{}>> => {
  const res = await api.delete<any, ApiResponse>(`cart/${itemId}/`);
  return res;
};

// Get cart count
export const getCartCountRequest = async (): Promise<ApiResponse<CartCountResponse>> => {
  const res = await api.get<any, ApiResponse>('cart/count/');
  res.data = cartCountResponseMapper(res);
  return res;
};

// React Query hooks
export const useCartItems = () =>
  useQuery({
    queryKey: ['cartItems'],
    queryFn: fetchCartItems,
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

export const useDeleteCartItem = () =>
  useMutation<ApiResponse<{}>, ApiErrorResponse, any>({
    mutationFn: async (itemId: string) => deleteCartItemRequest(itemId),
  });
