import lodash from 'lodash';
import { UseFormSetError } from 'react-hook-form';
import { ApiErrorResponse } from './types';
import { localStorageManager, history } from '@/app/lib/utils';

export const logout = () => {
  localStorageManager.removeToken();
  localStorageManager.removeRefreshToken();
  history?.push('/login');
};

export const getErrorMessages = (error: ApiErrorResponse) => {
  return (
    <div className="space-y-1">
      {Object.entries(error.data || {}).map(([key, errors]) => {
        return (
          <div key={key} className="flex gap-1">
            <span className="font-medium">{lodash.camelCase(key)}:</span>
            <span>{Array.isArray(errors) ? errors.join(', ') : errors}</span>
          </div>
        );
      })}
    </div>
  );
};

export const handleResponseErrorMessage = (
  error?: ApiErrorResponse | null,
  setError?: UseFormSetError<any>,
) => {
  if (!error || error.meta.status_code === 401) {
    return;
  }

  if (setError && error.data) {
    console.log(error.data);
    Object.entries(error.data).forEach(([field, error]) => {
      const camelCaseField = lodash.camelCase(field);
      if (Array.isArray(error) && error.length > 0) {
        setError(camelCaseField, {
          type: 'manual',
          message: error[0],
        });
      } else {
        setError(camelCaseField, {
          type: 'manual',
          message: error,
        });
      }
    });
  }
};
