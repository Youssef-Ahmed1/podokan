import axios from "axios";
import { server } from "../../server";

// create event
export const createevent = (data) => async (dispatch) => {
  try {
    dispatch({ type: "EVENT_CREATE_REQUEST" });

    const { data: response } = await axios.post(`${server}/event/create-event`, data);
    dispatch({ type: "EVENT_CREATE_SUCCESS", payload: response.event });
  } catch (error) {
    dispatch({
      type: "EVENT_CREATE_FAIL",
      payload: error.response.data.message,
    });
  }
};

// get all events of a shop
export const getAllEventsShop = (id) => async (dispatch) => {
  try {
    dispatch({ type: "GET_ALL_EVENTS_SHOP_REQUEST" });

    const { data } = await axios.get(`${server}/event/get-all-events/${id}`);
    dispatch({ type: "GET_ALL_EVENTS_SHOP_SUCCESS", payload: data.events });
  } catch (error) {
    dispatch({
      type: "GET_ALL_EVENTS_SHOP_FAIL",
      payload: error.response.data.message,
    });
  }
};

// delete event of a shop
export const deleteEvent = (id) => async (dispatch) => {
  try {
    dispatch({ type: "DELETE_EVENT_REQUEST" });

    const { data } = await axios.delete(`${server}/event/delete-shop-event/${id}`, {
      withCredentials: true,
    });

    dispatch({ type: "DELETE_EVENT_SUCCESS", payload: data.message });
  } catch (error) {
    dispatch({
      type: "DELETE_EVENT_FAIL",
      payload: error.response.data.message,
    });
  }
};

// get all events
export const getAllEvents = () => async (dispatch) => {
  try {
    dispatch({ type: "GET_ALL_EVENTS_REQUEST" });

    const { data } = await axios.get(`${server}/event/get-all-events`);
    dispatch({ type: "GET_ALL_EVENTS_SUCCESS", payload: data.events });
  } catch (error) {
    dispatch({
      type: "GET_ALL_EVENTS_FAIL",
      payload: error.response.data.message,
    });
  }
};