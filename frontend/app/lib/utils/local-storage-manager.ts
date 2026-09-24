
export const localStorageManager = {
    // Auth.
    setName: (name: string) => {
        localStorage.setItem('name', name);
    },
    getName: () => {
        return localStorage.getItem('name');
    },
    getToken: () => {
        return localStorage.getItem('token');
    },
    setToken: (token: string) => {
        localStorage.setItem('token', token);
    },
    removeToken: () => {
        localStorage.removeItem('token');
    },
    removeName: () => {
        localStorage.removeItem('name');
    },
    setRefreshToken: (token: string) => {
        localStorage.setItem('refreshToken', token);
    },
    getRefreshToken: () => {
        return localStorage.getItem('refreshToken');
    },
    removeRefreshToken: () => {
        localStorage.removeItem('refreshToken');
    },
    hasToken: () => {
        return !!localStorage.getItem('token');
    },
};
