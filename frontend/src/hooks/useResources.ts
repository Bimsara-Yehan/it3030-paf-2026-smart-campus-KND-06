import { useState, useEffect } from 'react';
import type { ResourceResponse } from '../api/resourceApi';
import { fetchResources } from '../api/resourceApi';

export const useResources = (type?: string, minCapacity?: number, location?: string, naturalQuery?: string) => {
    const [resources, setResources] = useState<ResourceResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadResources = async () => {
        try {
            setLoading(true);
            const data = await fetchResources(type, minCapacity, location, naturalQuery);
            setResources(data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch catalogue');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Load data immediately when component mounts or filter params change
    useEffect(() => {
        loadResources();
    }, [type, minCapacity, location, naturalQuery]);

    return { resources, loading, error, refetch: loadResources };
};
