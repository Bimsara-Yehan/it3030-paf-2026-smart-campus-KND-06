import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

interface ResourceOption {
  id: string;
  name: string;
  capacity?: number;
}

interface Props {
  onResourceChange: (resourceId: string | null, resourceName: string | null) => void;
}

const ResourceSelector = ({ onResourceChange }: Props) => {
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    axiosClient
      .get('/resources/search')
      .then(res => setResources(res.data?.data ?? []))
      .catch(() => setError('Failed to load resources'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelected(val);
    if (!val) {
      onResourceChange(null, null);
      return;
    }
    const resource = resources.find(r => r.id === val);
    onResourceChange(val, resource?.name ?? null);
  };

  if (loading) return <div className="text-sm text-gray-700 animate-pulse">Loading resources...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-900">Select Resource</label>
      <select
        value={selected}
        onChange={handleChange}
        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 bg-white transition-colors"
      >
        <option value="">— Choose a resource —</option>
        {resources.map(r => (
          <option key={r.id} value={r.id}>
            {r.name}{r.capacity ? ` (Capacity: ${r.capacity})` : ''}
          </option>
        ))}
      </select>
      {!selected && (
        <p className="text-xs text-amber-600 font-medium">⚠ Select a resource to view its booking calendar</p>
      )}
    </div>
  );
};

export default ResourceSelector;
