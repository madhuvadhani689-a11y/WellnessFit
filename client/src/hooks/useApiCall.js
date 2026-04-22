import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * A custom hook to handle async API calls with loading states, 
 * error handling, and toast notifications.
 *
 * @param {Function} apiFunc - The asynchronous function (e.g., an Axios call) to execute.
 * @param {Object} options - Configuration options.
 * @param {string} options.successMessage - Toast message to show on success.
 * @param {string} options.errorMessage - Toast message to show on error.
 * @param {Function} options.validator - An optional function to validate the returned data (e.g., AI JSON).
 * @returns {Object} - { execute, data, loading, error }
 */
export const useApiCall = (apiFunc, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFunc(...args);
        
        let resultData = response;
        // Typically, axios returns data in response.data
        if (response && response.data !== undefined) {
          resultData = response.data;
        }

        if (options.validator) {
          const isValid = options.validator(resultData);
          if (!isValid) {
            throw new Error('Received data is in an unexpected format.');
          }
        }

        setData(resultData);
        if (options.successMessage) {
          toast.success(options.successMessage);
        }
        return resultData;
      } catch (err) {
        let msg = options.errorMessage || err.response?.data?.message || err.message || 'An unexpected error occurred';
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, options]
  );

  return { execute, data, loading, error };
};
