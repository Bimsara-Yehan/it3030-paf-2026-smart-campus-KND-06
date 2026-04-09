import axiosClient from './axiosClient';

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

export const fetchResources = async (type?: string, minCapacity?: number, location?: string, naturalQuery?: string): Promise<ResourceResponse[]> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (minCapacity) params.append('minCapacity', minCapacity.toString());
    if (location) params.append('location', location);
    if (naturalQuery) params.append('naturalQuery', naturalQuery);

    const response = await axiosClient.get('/resources/search', { params });
    return response.data.data;
};

export const fetchResourceById = async (id: string): Promise<ResourceResponse> => {
    const response = await axiosClient.get(`/resources/${id}`);
    return response.data.data;
};

export const createResource = async (data: CreateResourceRequest): Promise<ResourceResponse> => {
    const response = await axiosClient.post('/resources', data);
    return response.data.data;
};
