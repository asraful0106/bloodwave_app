import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import axios from "axios";
import apiClient from "@/config/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UrgencyLevel = 1 | 2 | 3;
export type PatientType = "adult" | "child";
export type BloodRequestStatus =
  | "active"
  | "pending"
  | "fulfilled"
  | "cancelled"
  | "expired";

/** Shape of the populated user_id field returned by GET endpoints */
export interface BloodRequestRequester {
  _id: string;
  f_name: string;
  l_name?: string;
  blood_group_name?: string;
  user_image?: {
    link: string;
    provider: string;
    is_primary: boolean;
    meta?: { width?: number; height?: number };
  };
  user_contacts: Array<{
    _id: string;
    type: "phone" | "email" | "website" | "social";
    title: string;
    value: string;
    is_public: boolean;
  }>;
}

export interface BloodRequest {
  _id: string;
  user_id: BloodRequestRequester | string; // string before population, object after
  blood_group_name: string;
  description: string;
  units_required: number;
  lat: number;
  lng: number;
  location_label?: string;
  qty: number;
  urgency_level: UrgencyLevel;
  patient_type: PatientType;
  needed_by_datetime: string; // ISO string over the wire
  blood_request_status: BloodRequestStatus;
  share_token: string | null;
  donors_count: number;
  created_at: string;
  updated_at: string;
}

export type CreateBloodRequestPayload = Omit<
  BloodRequest,
  "_id" | "qty" | "donors_count" | "share_token" | "created_at" | "updated_at"
>;

export type UpdateBloodRequestPayload = Partial<
  Omit<CreateBloodRequestPayload, "user_id">
>;

// ─── Loading flags (one per operation) ───────────────────────────────────────

interface LoadingState {
  fetchAll: boolean;
  fetchOne: boolean;
  create: boolean;
  update: boolean;
  remove: boolean;
}

// ─── Error state (server-level vs field-level) ────────────────────────────────

interface ErrorState {
  /** Readable message for toast / alert banners */
  server: string | null;
  /** Field-level validation errors keyed by field name */
  fields: Record<string, string>;
}

// ─── Context state ────────────────────────────────────────────────────────────

interface BloodRequestState {
  requests: BloodRequest[];
  selectedRequest: BloodRequest | null;
  loading: LoadingState;
  error: ErrorState;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_LOADING"; key: keyof LoadingState; value: boolean }
  | { type: "SET_SERVER_ERROR"; message: string | null }
  | { type: "SET_FIELD_ERRORS"; fields: Record<string, string> }
  | { type: "CLEAR_ERRORS" }
  | { type: "SET_ALL"; requests: BloodRequest[] }
  | { type: "SET_SELECTED"; request: BloodRequest | null }
  | { type: "ADD"; request: BloodRequest }
  | { type: "REPLACE"; request: BloodRequest }
  | { type: "REMOVE"; id: string };

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_LOADING: LoadingState = {
  fetchAll: false,
  fetchOne: false,
  create: false,
  update: false,
  remove: false,
};

const INITIAL_ERROR: ErrorState = { server: null, fields: {} };

const initialState: BloodRequestState = {
  requests: [],
  selectedRequest: null,
  loading: INITIAL_LOADING,
  error: INITIAL_ERROR,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: BloodRequestState, action: Action): BloodRequestState {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: { ...state.loading, [action.key]: action.value },
      };

    case "SET_SERVER_ERROR":
      return { ...state, error: { ...state.error, server: action.message } };

    case "SET_FIELD_ERRORS":
      return { ...state, error: { ...state.error, fields: action.fields } };

    case "CLEAR_ERRORS":
      return { ...state, error: INITIAL_ERROR };

    case "SET_ALL":
      return { ...state, requests: action.requests };

    case "SET_SELECTED":
      return { ...state, selectedRequest: action.request };

    case "ADD":
      return { ...state, requests: [action.request, ...state.requests] };

    case "REPLACE":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r._id === action.request._id ? action.request : r,
        ),
        // Keep selectedRequest in sync if it's the same document
        selectedRequest:
          state.selectedRequest?._id === action.request._id
            ? action.request
            : state.selectedRequest,
      };

    case "REMOVE":
      return {
        ...state,
        requests: state.requests.filter((r) => r._id !== action.id),
        selectedRequest:
          state.selectedRequest?._id === action.id
            ? null
            : state.selectedRequest,
      };

    default:
      return state;
  }
}

// ─── Context & Provider ───────────────────────────────────────────────────────

interface BloodRequestContextValue extends BloodRequestState {
  fetchAllRequests: () => Promise<void>;
  fetchRequestById: (id: string) => Promise<void>;
  createRequest: (
    payload: CreateBloodRequestPayload,
  ) => Promise<BloodRequest | null>;
  updateRequest: (
    id: string,
    payload: UpdateBloodRequestPayload,
  ) => Promise<BloodRequest | null>;
  deleteRequest: (id: string) => Promise<boolean>;
  clearErrors: () => void;
  setSelectedRequest: (request: BloodRequest | null) => void;
}

const BloodRequestContext = createContext<BloodRequestContextValue | null>(
  null,
);


/** Extracts a readable error message and optional field map from an Axios error */
function parseError(error: unknown): {
  message: string;
  fields: Record<string, string>;
} {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const message: string =
      data?.message ?? error.message ?? "Something went wrong.";
    const fields: Record<string, string> = data?.errors ?? {};
    return { message, fields };
  }
  return { message: "An unexpected error occurred.", fields: {} };
}

export function BloodRequestProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Fetch all ──────────────────────────────────────────────────────────────

  const fetchAllRequests = useCallback(async () => {
    dispatch({ type: "SET_LOADING", key: "fetchAll", value: true });
    dispatch({ type: "CLEAR_ERRORS" });
    try {
      const { data } = await apiClient.get<{
        success: boolean;
        data: BloodRequest[];
      }>("/blood-req");
      dispatch({ type: "SET_ALL", requests: data.data });
    } catch (error) {
      const { message } = parseError(error);
      dispatch({ type: "SET_SERVER_ERROR", message });
    } finally {
      dispatch({ type: "SET_LOADING", key: "fetchAll", value: false });
    }
  }, []);

  // ── Fetch one ──────────────────────────────────────────────────────────────

  const fetchRequestById = useCallback(async (id: string) => {
    dispatch({ type: "SET_LOADING", key: "fetchOne", value: true });
    dispatch({ type: "CLEAR_ERRORS" });
    try {
      const { data } = await apiClient.get<{
        success: boolean;
        data: BloodRequest;
      }>(`/blood-req/${id}`);
      dispatch({ type: "SET_SELECTED", request: data.data });
    } catch (error) {
      const { message } = parseError(error);
      dispatch({ type: "SET_SERVER_ERROR", message });
      dispatch({ type: "SET_SELECTED", request: null });
    } finally {
      dispatch({ type: "SET_LOADING", key: "fetchOne", value: false });
    }
  }, []);

  // ── Create ─────────────────────────────────────────────────────────────────

  const createRequest = useCallback(
    async (
      payload: CreateBloodRequestPayload,
    ): Promise<BloodRequest | null> => {
      dispatch({ type: "SET_LOADING", key: "create", value: true });
      dispatch({ type: "CLEAR_ERRORS" });
      try {
        const { data } = await apiClient.post<{
          success: boolean;
          data: BloodRequest;
        }>("/blood-req", payload);
        dispatch({ type: "ADD", request: data.data });
        return data.data;
      } catch (error) {
        const { message, fields } = parseError(error);
        dispatch({ type: "SET_SERVER_ERROR", message });
        if (Object.keys(fields).length > 0) {
          dispatch({ type: "SET_FIELD_ERRORS", fields });
        }
        return null;
      } finally {
        dispatch({ type: "SET_LOADING", key: "create", value: false });
      }
    },
    [],
  );

  // ── Update ─────────────────────────────────────────────────────────────────

  const updateRequest = useCallback(
    async (
      id: string,
      payload: UpdateBloodRequestPayload,
    ): Promise<BloodRequest | null> => {
      dispatch({ type: "SET_LOADING", key: "update", value: true });
      dispatch({ type: "CLEAR_ERRORS" });
      try {
        const { data } = await apiClient.patch<{
          success: boolean;
          data: BloodRequest;
        }>(`/blood-req/${id}`, payload);
        dispatch({ type: "REPLACE", request: data.data });
        return data.data;
      } catch (error) {
        const { message, fields } = parseError(error);
        dispatch({ type: "SET_SERVER_ERROR", message });
        if (Object.keys(fields).length > 0) {
          dispatch({ type: "SET_FIELD_ERRORS", fields });
        }
        return null;
      } finally {
        dispatch({ type: "SET_LOADING", key: "update", value: false });
      }
    },
    [],
  );

  // ── Delete ─────────────────────────────────────────────────────────────────

  const deleteRequest = useCallback(async (id: string): Promise<boolean> => {
    dispatch({ type: "SET_LOADING", key: "remove", value: true });
    dispatch({ type: "CLEAR_ERRORS" });
    // console.log("Deleting Blood Req....");
    // console.log("Blood Req Id: ", id);
    try {
      await apiClient.delete(`/blood-req/${id}`);
      dispatch({ type: "REMOVE", id });
      return true;
    } catch (error) {
      // console.log("Error on deleting blood req: ", error)
      const { message } = parseError(error);
      dispatch({ type: "SET_SERVER_ERROR", message });
      return false;
    } finally {
      dispatch({ type: "SET_LOADING", key: "remove", value: false });
    }
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const clearErrors = useCallback(() => {
    dispatch({ type: "CLEAR_ERRORS" });
  }, []);

  const setSelectedRequest = useCallback((request: BloodRequest | null) => {
    dispatch({ type: "SET_SELECTED", request });
  }, []);

  return (
    <BloodRequestContext.Provider
      value={{
        ...state,
        fetchAllRequests,
        fetchRequestById,
        createRequest,
        updateRequest,
        deleteRequest,
        clearErrors,
        setSelectedRequest,
      }}
    >
      {children}
    </BloodRequestContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useBloodRequest(): BloodRequestContextValue {
  const context = useContext(BloodRequestContext);
  if (!context) {
    throw new Error(
      "useBloodRequest must be used within a <BloodRequestProvider>.",
    );
  }
  return context;
}
