/**
 * Simple in-memory cache with TTL (Time To Live)
 */
class Cache {
    constructor(ttl = 300) { // Default TTL: 5 minutes (300 seconds)
        this.cache = new Map();
        this.ttl = ttl * 1000; // Store as milliseconds
    }

    set(key, value) {
        const expiresAt = Date.now() + this.ttl;
        this.cache.set(key, { value, expiresAt });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return cached.value;
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

// Global instances for common data
const clientSelectionCache = new Cache(600); // 10 minutes

module.exports = {
    Cache,
    clientSelectionCache
};
