// client-auth.js - Client side authentication utilities
window.auth = {
    getToken() {
        return localStorage.getItem("_authToken");
    },
    
    storeToken(token) {
        if (token) {
            localStorage.setItem("_authToken", token);
        } else {
            localStorage.removeItem("_authToken");
        }
    },
    
    async signup(email, password, name) {
        const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");
        this.storeToken(data.token);
        return data.user;
    },
    
    async login(email, password) {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        this.storeToken(data.token);
        return data.user;
    },
    
    logout() {
        this.storeToken(null);
        window.location.reload();
    },
    
    async getMe() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const res = await fetch("/api/auth/me", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) {
                this.storeToken(null);
                return null;
            }
            return await res.json();
        } catch (e) {
            return null;
        }
    },
    
    async apiFetch(url, options = {}) {
        const token = this.getToken();
        const headers = options.headers || {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        options.headers = headers;
        return fetch(url, options);
    }
};
