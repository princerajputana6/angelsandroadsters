import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Auth', 'Products', 'Product', 'Categories', 'Sections', 'Companies', 'Events', 'Event', 'Orders', 'Order', 'Registrations', 'Users', 'Stats', 'Blogs', 'Blog', 'Addresses', 'CompTickets', 'TrailstormMetrics', 'Coupons', 'Resorts', 'Resort', 'ResortBookings'],
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
    listCategories: b.query({
      query: (params = {}) => ({ url: '/categories', params }),
      providesTags: ['Categories'],
    }),
    createCategory: b.mutation({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: b.mutation({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: b.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),

    // Sections
    listSections: b.query({
      query: (params = {}) => ({ url: '/sections', params }),
      providesTags: ['Sections'],
    }),
    createSection: b.mutation({
      query: (body) => ({ url: '/sections', method: 'POST', body }),
      invalidatesTags: ['Sections', 'Categories'],
    }),
    updateSection: b.mutation({
      query: ({ id, body }) => ({ url: `/sections/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Sections', 'Categories'],
    }),
    deleteSection: b.mutation({
      query: (id) => ({ url: `/sections/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Sections'],
    }),

    // Companies (partner logos shown on homepage marquee)
    listCompanies: b.query({ query: () => '/companies', providesTags: ['Companies'] }),
    createCompany: b.mutation({
      query: (body) => ({ url: '/companies', method: 'POST', body }),
      invalidatesTags: ['Companies'],
    }),
    updateCompany: b.mutation({
      query: ({ id, body }) => ({ url: `/companies/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Companies'],
    }),
    deleteCompany: b.mutation({
      query: (id) => ({ url: `/companies/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Companies'],
    }),

    // Trailstorm complimentary (FOC) tickets
    listCompTickets: b.query({
      query: (params = {}) => ({ url: '/admin/trailstorm/comp-tickets', params }),
      providesTags: ['CompTickets'],
    }),
    createCompTicket: b.mutation({
      query: (body) => ({ url: '/admin/trailstorm/comp-tickets', method: 'POST', body }),
      invalidatesTags: ['CompTickets', 'TrailstormMetrics'],
    }),
    updateCompTicket: b.mutation({
      query: ({ id, body }) => ({ url: `/admin/trailstorm/comp-tickets/${id}`, method: 'PUT', body }),
      invalidatesTags: ['CompTickets', 'TrailstormMetrics'],
    }),
    deleteCompTicket: b.mutation({
      query: (id) => ({ url: `/admin/trailstorm/comp-tickets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CompTickets', 'TrailstormMetrics'],
    }),
    trailstormMetrics: b.query({
      query: (params = {}) => ({ url: '/admin/trailstorm/metrics', params }),
      providesTags: ['TrailstormMetrics'],
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
    getRegistrationByTicket: b.query({ 
      query: (ticketId) => `/registrations/ticket/${ticketId}`,
      providesTags: (result, error, ticketId) => [{ type: 'Registrations', id: ticketId }],
    }),
    completeProfile: b.mutation({
      query: ({ id, ...body }) => ({ url: `/registrations/${id}/complete-profile`, method: 'PUT', body }),
      invalidatesTags: ['Registrations'],
    }),

    // Orders
    createOrder: b.mutation({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Orders'],
    }),
    myOrders: b.query({ query: () => '/orders/my', providesTags: ['Orders'] }),
    listOrders: b.query({ query: () => '/orders', providesTags: ['Orders'] }),
    getOrder: b.query({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    updateOrder: b.mutation({
      query: ({ id, body }) => ({ url: `/orders/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Orders'],
    }),
    cancelOrder: b.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`,
        method: 'POST',
      }),
      invalidatesTags: ['Orders'],
    }),
    deleteOrder: b.mutation({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Orders'],
    }),

    // Addresses (current user)
    myAddresses: b.query({ query: () => '/users/me/addresses', providesTags: ['Addresses'] }),
    addAddress: b.mutation({
      query: (body) => ({ url: '/users/me/addresses', method: 'POST', body }),
      invalidatesTags: ['Addresses'],
    }),
    updateAddress: b.mutation({
      query: ({ id, body }) => ({ url: `/users/me/addresses/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Addresses'],
    }),
    deleteAddress: b.mutation({
      query: (id) => ({ url: `/users/me/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Addresses'],
    }),

    // Admin
    adminStats: b.query({ query: () => '/admin/stats', providesTags: ['Stats'] }),
    listUsers: b.query({ query: () => '/admin/users', providesTags: ['Users'] }),
    updateUser: b.mutation({
      query: ({ id, body }) => ({ url: `/admin/users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Users'],
    }),
    resetUserPassword: b.mutation({
      query: ({ id, password }) => ({ url: `/admin/users/${id}/reset-password`, method: 'POST', body: { password } }),
    }),

    // Reviews
    createReview: b.mutation({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),

    // Blogs
    listBlogs: b.query({
      query: (params = {}) => ({ url: '/blogs', params }),
      providesTags: ['Blogs'],
    }),
    getBlog: b.query({
      query: (id) => `/blogs/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Blog', id }],
    }),
    getBlogBySlug: b.query({
      query: (slug) => `/blogs/slug/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'Blog', id: slug }],
    }),
    generateBlog: b.mutation({
      query: (body) => ({ url: '/blogs/generate', method: 'POST', body }),
    }),
    createBlog: b.mutation({
      query: (body) => ({ url: '/blogs', method: 'POST', body }),
      invalidatesTags: ['Blogs'],
    }),
    updateBlog: b.mutation({
      query: ({ id, body }) => ({ url: `/blogs/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Blogs', 'Blog'],
    }),
    deleteBlog: b.mutation({
      query: (id) => ({ url: `/blogs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Blogs'],
    }),

    // Coupons (admin)
    listCoupons: b.query({ query: () => '/admin/coupons', providesTags: ['Coupons'] }),
    createCoupon: b.mutation({
      query: (body) => ({ url: '/admin/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupons'],
    }),
    toggleCoupon: b.mutation({
      query: ({ id, isActive }) => ({ url: `/admin/coupons/${id}`, method: 'PATCH', body: { isActive } }),
      invalidatesTags: ['Coupons'],
    }),
    deleteCoupon: b.mutation({
      query: (id) => ({ url: `/admin/coupons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Coupons'],
    }),
    validateCoupon: b.mutation({
      query: (body) => ({ url: '/coupons/validate', method: 'POST', body }),
    }),

    // Resorts
    listResorts: b.query({
      query: (params = {}) => ({ url: '/resorts', params }),
      providesTags: ['Resorts'],
    }),
    getResort: b.query({
      query: (slug) => `/resorts/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'Resort', id: slug }],
    }),
    createResort: b.mutation({
      query: (body) => ({ url: '/resorts', method: 'POST', body }),
      invalidatesTags: ['Resorts'],
    }),
    updateResort: b.mutation({
      query: ({ slug, body }) => ({ url: `/resorts/${slug}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { slug }) => ['Resorts', { type: 'Resort', id: slug }],
    }),
    deleteResort: b.mutation({
      query: (slug) => ({ url: `/resorts/${slug}`, method: 'DELETE' }),
      invalidatesTags: ['Resorts'],
    }),

    // Resort bookings
    createResortBooking: b.mutation({
      query: (body) => ({ url: '/resort-bookings', method: 'POST', body }),
      invalidatesTags: ['ResortBookings', 'Resort'],
    }),
    myResortBookings: b.query({ query: () => '/resort-bookings/my', providesTags: ['ResortBookings'] }),
    listResortBookings: b.query({
      query: (params = {}) => ({ url: '/resort-bookings', params }),
      providesTags: ['ResortBookings'],
    }),
    updateResortBooking: b.mutation({
      query: ({ id, body }) => ({ url: `/resort-bookings/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['ResortBookings'],
    }),
  }),
});

export const {
  useMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation,
  useListProductsQuery, useGetProductQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation,
  useListCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
  useListSectionsQuery, useCreateSectionMutation, useUpdateSectionMutation, useDeleteSectionMutation,
  useListCompaniesQuery, useCreateCompanyMutation, useUpdateCompanyMutation, useDeleteCompanyMutation,
  useListCompTicketsQuery, useCreateCompTicketMutation, useUpdateCompTicketMutation, useDeleteCompTicketMutation, useTrailstormMetricsQuery,
  useListEventsQuery, useGetEventQuery, useGetEventSlotsQuery, useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation,
  useCreateRegistrationMutation, useMyRegistrationsQuery, useGetRegistrationByTicketQuery, useCompleteProfileMutation,
  useCreateOrderMutation, useMyOrdersQuery, useListOrdersQuery, useGetOrderQuery, useUpdateOrderMutation, useCancelOrderMutation, useDeleteOrderMutation,
  useMyAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation,
  useAdminStatsQuery, useListUsersQuery, useUpdateUserMutation, useResetUserPasswordMutation,
  useCreateReviewMutation,
  useListBlogsQuery, useGetBlogQuery, useGetBlogBySlugQuery, useGenerateBlogMutation, useCreateBlogMutation, useUpdateBlogMutation, useDeleteBlogMutation,
  useListCouponsQuery, useCreateCouponMutation, useToggleCouponMutation, useDeleteCouponMutation, useValidateCouponMutation,
  useListResortsQuery, useGetResortQuery, useCreateResortMutation, useUpdateResortMutation, useDeleteResortMutation,
  useCreateResortBookingMutation, useMyResortBookingsQuery, useListResortBookingsQuery, useUpdateResortBookingMutation,
} = api;
