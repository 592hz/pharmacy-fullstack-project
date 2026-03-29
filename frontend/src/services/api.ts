const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            // Optional: redirect to login
        }
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    get: <T>(url: string) => fetch(`${API_BASE_URL}${url}`, {
        headers: getHeaders()
    }).then((res) => handleResponse<T>(res)),
    post: <T>(url: string, data: unknown) => fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse<T>),
    put: <T>(url: string, data: unknown) => fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse<T>),
    patch: <T>(url: string, data: unknown) => fetch(`${API_BASE_URL}${url}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse<T>),
    delete: <T>(url: string) => fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: getHeaders()
    }).then((res) => handleResponse<T>(res))
};
