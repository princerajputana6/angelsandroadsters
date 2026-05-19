import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Auth', 'Products', 'Product', 'Categories', 'Events', 'Event', 'Orders', 'Order', 'Registrations', 'Users', 'Stats'],
  endpoints: (b) => ({
    // Auth
    me: b.query({ query: () => '/auth/me', providesTags: ['Auth'] }),
    login: b.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    register: b.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    logout: b.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth'],
    }),

    // Products
    listProducts: b.query({
      query: (params = {}) => ({ url: '/products', params }),
      providesTags: ['Products'],
    }),
    getProduct: b.query({
      query: (slug) => `/products/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'Product', id: slug }],
    }),
    createProduct: b.mutation({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: b.mutation({
      query: ({ slug, body }) => ({ url: `/products/${slug}`, method: 'PUT', body }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: b.mutation({
      query: (slug) => ({ url: `/products/${slug}`, method: 'DELETE' }),
      invalidatesTags: ['Products'],
    }),

    // Categories
    listCategories: b.query({ query: () => '/categories', providesTags: ['Categories'] }),
    createCategory: b.mutation({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),

    // Events
    listEvents: b.query({
      query: (params = {}) => ({ url: '/events', params }),
      providesTags: ['Events'],
    }),
    getEvent: b.query({
      query: (slug) => `/events/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'Event', id: slug }],
    }),
    getEventSlots: b.query({
      query: (slug) => `/events/${slug}/slots`,
      providesTags: (_r, _e, slug) => [{ type: 'Event', id: `slots-${slug}` }],
    }),
    createEvent: b.mutation({
      query: (body) => ({ url: '/events', method: 'POST', body }),
      invalidatesTags: ['Events'],
    }),
    updateEvent: b.mutation({
      query: ({ slug, body }) => ({ url: `/events/${slug}`, method: 'PUT', body }),
      invalidatesTags: ['Events'],
    }),
    deleteEvent: b.mutation({
      query: (slug) => ({ url: `/events/${slug}`, method: 'DELETE' }),
      invalidatesTags: ['Events'],
    }),

    // Registrations
    createRegistration: b.mutation({
      query: (body) => ({ url: '/registrations', method: 'POST', body }),
      invalidatesTags: ['Registrations', 'Event'],
    }),
    myRegistrations: b.query({ query: () => '/registrations/my', providesTags: ['Registrations'] }),

    // Orders
    createOrder: b.mutation({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Orders'],
    }),
    myOrders: b.query({ query: () => '/orders/my', providesTags: ['Orders'] }),
    listOrders: b.query({ query: () => '/orders', providesTags: ['Orders'] }),
    updateOrder: b.mutation({
      query: ({ id, body }) => ({ url: `/orders/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Orders'],
    }),

    // Admin
    adminStats: b.query({ query: () => '/admin/stats', providesTags: ['Stats'] }),
    listUsers: b.query({ query: () => '/admin/users', providesTags: ['Users'] }),
    updateUser: b.mutation({
      query: ({ id, body }) => ({ url: `/admin/users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Users'],
    }),

    // Reviews
    createReview: b.mutation({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation,
  useListProductsQuery, useGetProductQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation,
  useListCategoriesQuery, useCreateCategoryMutation,
  useListEventsQuery, useGetEventQuery, useGetEventSlotsQuery, useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation,
  useCreateRegistrationMutation, useMyRegistrationsQuery,
  useCreateOrderMutation, useMyOrdersQuery, useListOrdersQuery, useUpdateOrderMutation,
  useAdminStatsQuery, useListUsersQuery, useUpdateUserMutation,
  useCreateReviewMutation,
} = api;
