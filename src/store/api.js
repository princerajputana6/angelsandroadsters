import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Auth', 'Products', 'Product', 'Categories', 'Sections', 'Companies', 'Events', 'Event', 'Orders', 'Order', 'Registrations', 'Users', 'Stats', 'Blogs', 'Blog', 'Addresses', 'CompTickets', 'TrailstormMetrics', 'Coupons', 'Resorts', 'Resort', 'ResortBookings', 'Affiliate', 'Affiliates', 'TrailstormAnalytics', 'Races', 'Race', 'RaceCategories', 'RaceDashboard', 'RaceIndexes', 'RaceEntries', 'RacePlates', 'RaceSessions', 'RaceConflicts', 'RaceResults', 'RaceReconciliation', 'RaceBoard', 'RidersPool'],
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
    trailstormAnalytics: b.query({
      query: (params = {}) => ({ url: '/admin/trailstorm/analytics', params }),
      providesTags: ['TrailstormAnalytics'],
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

    // Affiliate (current user)
    myAffiliate: b.query({ query: () => '/affiliate/me', providesTags: ['Affiliate'] }),
    applyAffiliate: b.mutation({
      query: (body) => ({ url: '/affiliate/apply', method: 'POST', body }),
      invalidatesTags: ['Affiliate'],
    }),
    trackAffiliate: b.mutation({
      query: (code) => ({ url: '/affiliate/track', method: 'POST', body: { code } }),
    }),

    // Affiliate (admin)
    listAffiliates: b.query({ query: () => '/admin/affiliates', providesTags: ['Affiliates'] }),
    createAffiliate: b.mutation({
      query: (body) => ({ url: '/admin/affiliates', method: 'POST', body }),
      invalidatesTags: ['Affiliates'],
    }),
    getAffiliate: b.query({
      query: (id) => `/admin/affiliates/${id}`,
      providesTags: ['Affiliate'],
    }),
    updateAffiliate: b.mutation({
      query: ({ id, body }) => ({ url: `/admin/affiliates/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Affiliates', 'Affiliate'],
    }),
    updateConversion: b.mutation({
      query: ({ id, status }) => ({ url: `/admin/affiliate-conversions/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Affiliates', 'Affiliate'],
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

    // Team registrations (staff / volunteer / organizer) + reg-ID validation
    listTeamRegistrations: b.query({
      query: (params = {}) => ({ url: '/admin/registrations/issue', params }),
      providesTags: ['Registrations'],
    }),
    issueTeamRegistration: b.mutation({
      query: (body) => ({ url: '/admin/registrations/issue', method: 'POST', body }),
      invalidatesTags: ['Registrations'],
    }),
    validateRegistration: b.mutation({
      query: (body) => ({ url: '/registrations/validate', method: 'POST', body }),
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

    // ---------------------------------------------------------- Race module
    raceDashboard: b.query({
      query: () => '/race/dashboard',
      providesTags: ['RaceDashboard'],
    }),

    // Races
    listRaces: b.query({
      query: (params = {}) => ({ url: '/race/races', params }),
      providesTags: ['Races'],
    }),
    getRace: b.query({
      query: (id) => `/race/races/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Race', id }],
    }),
    createRace: b.mutation({
      query: (body) => ({ url: '/race/races', method: 'POST', body }),
      invalidatesTags: ['Races', 'RaceDashboard'],
    }),
    updateRace: b.mutation({
      query: ({ id, body }) => ({ url: `/race/races/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['Races', 'RaceDashboard', { type: 'Race', id }],
    }),
    deleteRace: b.mutation({
      query: (id) => ({ url: `/race/races/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Races', 'RaceDashboard'],
    }),
    setRaceStatus: b.mutation({
      query: ({ id, status, reason }) => ({ url: `/race/races/${id}/status`, method: 'POST', body: { status, reason } }),
      invalidatesTags: (_r, _e, { id }) => ['Races', 'RaceDashboard', { type: 'Race', id }],
    }),

    // Race categories
    listRaceCategories: b.query({
      query: (race) => ({ url: '/race/categories', params: { race } }),
      providesTags: ['RaceCategories'],
    }),
    createRaceCategory: b.mutation({
      query: (body) => ({ url: '/race/categories', method: 'POST', body }),
      invalidatesTags: ['RaceCategories', 'RaceDashboard'],
    }),
    updateRaceCategory: b.mutation({
      query: ({ id, body }) => ({ url: `/race/categories/${id}`, method: 'PUT', body }),
      invalidatesTags: ['RaceCategories'],
    }),
    deleteRaceCategory: b.mutation({
      query: (id) => ({ url: `/race/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['RaceCategories', 'RaceDashboard'],
    }),

    // Index maintenance (admin)
    raceIndexReport: b.query({
      query: () => '/admin/race/ensure-indexes',
      providesTags: ['RaceIndexes'],
    }),
    ensureRaceIndexes: b.mutation({
      query: () => ({ url: '/admin/race/ensure-indexes', method: 'POST' }),
      invalidatesTags: ['RaceIndexes'],
    }),

    // User search for the rider picker
    searchRaceUsers: b.query({
      query: (q) => ({ url: '/race/user-search', params: { q } }),
    }),

    // Global rider pool
    listRiders: b.query({
      query: (params = {}) => ({ url: '/race/riders', params }),
      providesTags: ['RidersPool'],
    }),
    createRider: b.mutation({
      query: (body) => ({ url: '/race/riders', method: 'POST', body }),
      invalidatesTags: ['RidersPool'],
    }),
    updateRider: b.mutation({
      query: ({ id, body }) => ({ url: `/race/riders/${id}`, method: 'PUT', body }),
      invalidatesTags: ['RidersPool'],
    }),
    deleteRider: b.mutation({
      query: (id) => ({ url: `/race/riders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['RidersPool'],
    }),
    backfillParticipantNos: b.mutation({
      // No arg → gap-fill; { start } → reseed everyone contiguously from start.
      query: (body) => ({ url: '/admin/race/backfill-participant-numbers', method: 'POST', body: body || {} }),
      invalidatesTags: ['RidersPool', 'RaceEntries', 'RaceDashboard', 'RaceBoard'],
    }),
    bulkAddEntries: b.mutation({
      query: (body) => ({ url: '/race/entries/bulk', method: 'POST', body }),
      invalidatesTags: ['RaceEntries', 'RaceDashboard', 'RaceBoard'],
    }),

    // Race entries (riders)
    listRaceEntries: b.query({
      query: (race) => ({ url: '/race/entries', params: { race } }),
      providesTags: ['RaceEntries'],
    }),
    createRaceEntry: b.mutation({
      query: (body) => ({ url: '/race/entries', method: 'POST', body }),
      invalidatesTags: ['RaceEntries', 'RaceDashboard', 'RidersPool'],
    }),
    updateRaceEntry: b.mutation({
      query: ({ id, body }) => ({ url: `/race/entries/${id}`, method: 'PUT', body }),
      invalidatesTags: ['RaceEntries'],
    }),
    setEntryParticipantNo: b.mutation({
      query: ({ id, participantNo }) => ({ url: `/race/entries/${id}/participant-no`, method: 'PUT', body: { participantNo } }),
      invalidatesTags: ['RaceEntries', 'RidersPool'],
    }),
    setRaceEntryStatus: b.mutation({
      query: ({ id, status, reason }) => ({ url: `/race/entries/${id}/status`, method: 'POST', body: { status, reason } }),
      invalidatesTags: ['RaceEntries', 'RaceDashboard'],
    }),
    deleteRaceEntry: b.mutation({
      query: (arg) => {
        const id = arg?.id ?? arg;
        const force = arg?.force;
        return { url: `/race/entries/${id}`, method: 'DELETE', params: force ? { force: 1 } : undefined };
      },
      invalidatesTags: ['RaceEntries', 'RaceDashboard', 'RaceResults', 'RaceBoard'],
    }),

    // Checkpoint sessions
    raceMySessions: b.query({
      query: () => '/race/sessions/mine',
      providesTags: ['RaceSessions'],
    }),
    listRaceSessions: b.query({
      query: (race) => ({ url: '/race/sessions', params: { race } }),
      providesTags: ['RaceSessions'],
    }),
    createRaceSession: b.mutation({
      query: (body) => ({ url: '/race/sessions', method: 'POST', body }),
      invalidatesTags: ['RaceSessions'],
    }),

    // Race plates
    racePlates: b.query({
      query: ({ race, entryIds }) => ({ url: '/race/plates', params: { race, ...(entryIds ? { entryIds: entryIds.join(',') } : {}) } }),
      providesTags: ['RacePlates'],
    }),
    markPlatesPrinted: b.mutation({
      query: (entryIds) => ({ url: '/race/plates/mark-printed', method: 'POST', body: { entryIds } }),
      invalidatesTags: ['RacePlates', 'RaceEntries'],
    }),

    // Conflicts, results, reconciliation (M4)
    raceConflicts: b.query({
      query: ({ race, status }) => ({ url: '/race/conflicts', params: { race, ...(status ? { status } : {}) } }),
      providesTags: ['RaceConflicts'],
    }),
    resolveRaceConflict: b.mutation({
      query: ({ id, action, reason, resolutionEventId }) => ({ url: `/race/conflicts/${id}/resolve`, method: 'POST', body: { action, reason, resolutionEventId } }),
      invalidatesTags: ['RaceConflicts', 'RaceResults', 'RaceDashboard'],
    }),
    raceResults: b.query({
      query: (race) => ({ url: '/race/results', params: { race } }),
      providesTags: ['RaceResults'],
    }),
    recomputeRace: b.mutation({
      query: (id) => ({ url: `/race/races/${id}/recompute`, method: 'POST' }),
      invalidatesTags: ['RaceResults', 'RaceConflicts', 'RaceDashboard'],
    }),
    finalizeRaceResults: b.mutation({
      query: ({ id, reason, waiveOpenConflicts }) => ({ url: `/race/races/${id}/results/finalize`, method: 'POST', body: { reason, waiveOpenConflicts } }),
      invalidatesTags: (_r, _e, { id }) => ['RaceResults', 'Races', 'RaceDashboard', { type: 'Race', id }],
    }),
    adjustRaceResult: b.mutation({
      query: ({ id, ...body }) => ({ url: `/race/races/${id}/results/adjust`, method: 'PUT', body }),
      invalidatesTags: ['RaceResults', 'RaceDashboard'],
    }),
    autoAssignPoints: b.mutation({
      query: ({ id, ...body }) => ({ url: `/race/races/${id}/results/auto-points`, method: 'POST', body }),
      invalidatesTags: ['RaceResults', 'RaceDashboard'],
    }),
    raceReconciliation: b.query({
      query: (race) => ({ url: '/race/reconciliation', params: { race } }),
      providesTags: ['RaceReconciliation'],
    }),
    revokeRaceSession: b.mutation({
      query: ({ sessionId, reason }) => ({ url: `/race/sessions/${sessionId}/revoke`, method: 'POST', body: { reason } }),
      invalidatesTags: ['RaceSessions', 'RaceReconciliation'],
    }),

    // Admin race board (simple start → out/in → end flow)
    raceBoard: b.query({
      query: (id) => `/race/races/${id}/board`,
      providesTags: ['RaceBoard'],
    }),
    raceBoardAction: b.mutation({
      query: ({ id, action, entryId }) => ({ url: `/race/races/${id}/board`, method: 'POST', body: { action, entryId } }),
      // Instant feedback: optimistically flip the rider locally, then replace the
      // cache with the authoritative server state when the POST returns (no extra
      // board GET). On error, roll back. This removes the per-click lag.
      async onQueryStarted({ id, action, entryId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData('raceBoard', id, (draft) => {
            if ((action === 'out' || action === 'in') && draft?.riders) {
              const r = draft.riders.find((x) => x.entryId === entryId);
              if (r) {
                if (action === 'out') { r.state = 'out'; r.startedAt = new Date().toISOString(); }
                else { r.state = 'done'; r.finishedAt = new Date().toISOString(); if (r.startedAt) r.timeMs = Date.now() - new Date(r.startedAt).getTime(); }
                draft.counts.done = draft.riders.filter((x) => x.state === 'done').length;
                draft.counts.out = draft.riders.filter((x) => x.state === 'out').length;
                draft.allIn = draft.riders.length > 0 && draft.riders.every((x) => x.state === 'done');
              }
            }
          })
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(api.util.updateQueryData('raceBoard', id, () => data)); // authoritative state
        } catch {
          patch.undo();
        }
      },
      // Other pages (results/dashboard) refresh only if currently open; the board
      // itself is updated above, so it is intentionally NOT invalidated here.
      invalidatesTags: (_r, _e, { id }) => ['RaceResults', 'RaceDashboard', 'Races', { type: 'Race', id }],
    }),
  }),
});

export const {
  useMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation,
  useListProductsQuery, useGetProductQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation,
  useListCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
  useListSectionsQuery, useCreateSectionMutation, useUpdateSectionMutation, useDeleteSectionMutation,
  useListCompaniesQuery, useCreateCompanyMutation, useUpdateCompanyMutation, useDeleteCompanyMutation,
  useListCompTicketsQuery, useCreateCompTicketMutation, useUpdateCompTicketMutation, useDeleteCompTicketMutation, useTrailstormMetricsQuery, useTrailstormAnalyticsQuery,
  useListEventsQuery, useGetEventQuery, useGetEventSlotsQuery, useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation,
  useCreateRegistrationMutation, useMyRegistrationsQuery, useGetRegistrationByTicketQuery, useCompleteProfileMutation,
  useCreateOrderMutation, useMyOrdersQuery, useListOrdersQuery, useGetOrderQuery, useUpdateOrderMutation, useCancelOrderMutation, useDeleteOrderMutation,
  useMyAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation,
  useAdminStatsQuery, useListUsersQuery, useUpdateUserMutation, useResetUserPasswordMutation,
  useMyAffiliateQuery, useApplyAffiliateMutation, useTrackAffiliateMutation,
  useListAffiliatesQuery, useCreateAffiliateMutation, useGetAffiliateQuery, useUpdateAffiliateMutation, useUpdateConversionMutation,
  useCreateReviewMutation,
  useListBlogsQuery, useGetBlogQuery, useGetBlogBySlugQuery, useGenerateBlogMutation, useCreateBlogMutation, useUpdateBlogMutation, useDeleteBlogMutation,
  useListCouponsQuery, useCreateCouponMutation, useToggleCouponMutation, useDeleteCouponMutation, useValidateCouponMutation,
  useListResortsQuery, useGetResortQuery, useCreateResortMutation, useUpdateResortMutation, useDeleteResortMutation,
  useCreateResortBookingMutation, useMyResortBookingsQuery, useListResortBookingsQuery, useUpdateResortBookingMutation,
  useListTeamRegistrationsQuery, useIssueTeamRegistrationMutation, useValidateRegistrationMutation,
  useRaceDashboardQuery,
  useListRacesQuery, useGetRaceQuery, useCreateRaceMutation, useUpdateRaceMutation, useDeleteRaceMutation, useSetRaceStatusMutation,
  useListRaceCategoriesQuery, useCreateRaceCategoryMutation, useUpdateRaceCategoryMutation, useDeleteRaceCategoryMutation,
  useRaceIndexReportQuery, useEnsureRaceIndexesMutation,
  useListRaceEntriesQuery, useCreateRaceEntryMutation, useUpdateRaceEntryMutation, useSetEntryParticipantNoMutation, useSetRaceEntryStatusMutation, useDeleteRaceEntryMutation,
  useSearchRaceUsersQuery,
  useListRidersQuery, useCreateRiderMutation, useUpdateRiderMutation, useDeleteRiderMutation, useBackfillParticipantNosMutation, useBulkAddEntriesMutation,
  useRacePlatesQuery, useMarkPlatesPrintedMutation,
  useRaceMySessionsQuery, useListRaceSessionsQuery, useCreateRaceSessionMutation,
  useRaceConflictsQuery, useResolveRaceConflictMutation,
  useRaceResultsQuery, useRecomputeRaceMutation, useFinalizeRaceResultsMutation, useAdjustRaceResultMutation, useAutoAssignPointsMutation,
  useRaceReconciliationQuery, useRevokeRaceSessionMutation,
  useRaceBoardQuery, useRaceBoardActionMutation,
} = api;
