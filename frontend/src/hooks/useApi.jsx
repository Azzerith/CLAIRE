import { useState, useEffect } from 'react';

/**
 * Custom hook untuk handle API calls dengan state management
 * @param {Function} apiCall - Function yang mengembalikan promise (biasanya axios call)
 * @param {Array} dependencies - Dependencies untuk useEffect (seperti [param1, param2])
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiCall();
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  // Function untuk manual refetch
  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};