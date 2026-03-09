import { error as logError } from '../utils/logger';

export const baseUrl = 'https://api.corp.crackthecampus.com/api';
export const staticUrl = '';
export const SESSION_EXPIRED_MESSAGE = 'Failed to refresh access token';

function clearSession() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('userdata');
}

export async function authFetch(url, options) {
  let accessToken = localStorage.getItem('access'); // Declare `let` to allow reassignment
  const refreshToken = localStorage.getItem('refresh');

  const { body, method, headers = {} } = options;

  // Check if body is FormData
  const isFormData = body instanceof FormData;
  
  const requestOptions = {
    method: method,
    headers: {
      Authorization: 'Bearer ' + accessToken,
      ...headers, // Merge any additional headers
    },
    body: body, // Don't JSON.stringify here, let the caller handle it
  };

  // Only set Content-Type for JSON, let browser set it for FormData
  if (!isFormData) {
    requestOptions.headers['Content-Type'] = 'application/json';
  }

  // Fetch request
  let response = await fetch(baseUrl + url, requestOptions);

  if (response.status === 401) {
    // No refresh token or refresh failed = session expired
    if (!refreshToken) {
      clearSession();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
    const refreshOptions = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + refreshToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }), // Sending refresh token in the body with key "refresh"
    };

    const refreshResponse = await fetch(
      baseUrl + '/auth/token/refresh/',
      refreshOptions,
    );
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      accessToken = data.access;
      localStorage.setItem('access', accessToken); // Update the access token in localStorage
      requestOptions.headers['Authorization'] = 'Bearer ' + accessToken; // Update headers with new access token

      // Retry original request with the new access token
      response = await fetch(baseUrl + url, requestOptions);
    } else {
      clearSession();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
  }

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response;
}

export const FixImageRoute = (imageUrl) => {
  return staticUrl + imageUrl;
};

export async function login(username, password) {
  const payload = JSON.stringify({ email: username, password: password });
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(baseUrl + '/auth/login/', {
      method: 'POST',
      headers: headers,
      body: payload,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    // Store tokens and user details in localStorage
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('userdata', JSON.stringify(data.user));

    return data; // Return the response for further handling
  } catch (error) {
    logError('Login failed:', error);
    throw error;
  }
}

export function logout() {
  clearSession();
}

export function useAuth() {
  const refreshToken = localStorage.getItem('refresh');
  return [!!refreshToken];
}

export async function authFetchPayload(path, payload, method) {
  let accessToken = localStorage.getItem('access');
  const refreshToken = localStorage.getItem('refresh');


  const options = {
    method: method,
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    },
    body: payload instanceof FormData ? payload : JSON.stringify(payload)
  };

  // Fetch request
  const response = await fetch(baseUrl + path, options);

  if (response.status === 401) {
    if (!refreshToken) {
      clearSession();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
    // If the response is 401 (Unauthorized), attempt to refresh the access token
    const refreshOptions = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + refreshToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken }) // Sending refresh token in the body with key "refresh"
    };

    const refreshResponse = await fetch(baseUrl + '/auth/token/refresh/', refreshOptions);
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      accessToken = data.access;
      localStorage.setItem('access', accessToken); // Update the access token in localStorage
      options.headers['Authorization'] = 'Bearer ' + accessToken; // Update headers with new access token
      // Retry original request with the new access token
      return fetch(baseUrl + path, options)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response;
        })
        .catch(error => {
          logError('There was a problem with the fetch operation:', error);
          throw error; // Propagate the error to the caller
        });
    } else {
      clearSession();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
  } else if (response.status === 400) {
    const errorData = await response.json();
    throw JSON.stringify(errorData);
  } else if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response;
}
