import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1/resources';

// We intercept the default token logic from Member 4 if available, or just send requests.
// In a real env, Member 4's global axios interceptor would auto-attach the Authorization headers.

export interface ResourceResponse {
    id: string;
    name: string;
    type: string;
    capacity: number;
    location: string;
    description: string;
    status: string;
    createdById: string;
    availabilities: any[];
}

export interface CreateResourceRequest {
    name: string;
    type: string;
    capacity: number;
    location: string;
    description: string;
}

export const fetchResources = async (type?: string, minCapacity?: number, location?: string): Promise<ResourceResponse[]> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (minCapacity) params.append('minCapacity', minCapacity.toString());
    if (location) params.append('location', location);

    // Using browser's local storage temporary standard for Member 4's auth token
    const token = localStorage.getItem('token'); 
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get(API_BASE_URL, { params, headers });
    return response.data;
};

export const fetchResourceById = async (id: string): Promise<ResourceResponse> => {
    const token = localStorage.getItem('token'); 
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get(`${API_BASE_URL}/${id}`, { headers });
    return response.data;
};

export const createResource = async (data: CreateResourceRequest): Promise<ResourceResponse> => {
    const token = localStorage.getItem('token'); 
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.post(API_BASE_URL, data, { headers });
    return response.data;
};
