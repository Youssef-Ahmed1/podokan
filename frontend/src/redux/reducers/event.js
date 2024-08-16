import { createReducer } from "@reduxjs/toolkit";



const eventInitialState = {
  isLoading: false,
  events: [],
  event: null,
  message: null,
  error: null,
};

export const eventReducer = createReducer(eventInitialState, (builder) => {
  builder
    .addCase("EVENT_CREATE_REQUEST", (state) => {
      state.isLoading = true;
    })
    .addCase("EVENT_CREATE_SUCCESS", (state, action) => {
      state.isLoading = false;
      state.event = action.payload;
      state.success = true;
    })
    .addCase("EVENT_CREATE_FAIL", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    })
    .addCase("GET_ALL_EVENTS_SHOP_REQUEST", (state) => {
      state.isLoading = true;
    })
    .addCase("GET_ALL_EVENTS_SHOP_SUCCESS", (state, action) => {
      state.isLoading = false;
      state.events = action.payload;
    })
    .addCase("GET_ALL_EVENTS_SHOP_FAIL", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("DELETE_EVENT_REQUEST", (state) => {
      state.isLoading = true;
    })
    .addCase("DELETE_EVENT_SUCCESS", (state, action) => {
      state.isLoading = false;
      state.message = action.payload;
    })
    .addCase("DELETE_EVENT_FAIL", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("GET_ALL_EVENTS_REQUEST", (state) => {
      state.isLoading = true;
    })
    .addCase("GET_ALL_EVENTS_SUCCESS", (state, action) => {
      state.isLoading = false;
      state.events = action.payload;
    })
    .addCase("GET_ALL_EVENTS_FAIL", (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addCase("CLEAR_ERRORS", (state) => {
      state.error = null;
    });
});