export interface DriverInfo {
  email: string;
  name: string;
  bus_id: string;
  route_id: string;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  driver: {
    email: string;
    name: string;
    bus_id: string;
    route_id: string;
  };
}

export interface LocationUpdate {
  bus_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export interface StartTripRequest {
  bus_id: string;
  route_id: string;
}
