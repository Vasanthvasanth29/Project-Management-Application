"use strict";
/**
 * Node-environment polyfills for the browser APIs the store's persistence
 * layers touch at module scope (localStorage reads during store creation).
 * vitest setupFiles execute BEFORE the test module and its import graph, so
 * every import sees these globals.
 */
class MemoryStorage {
    store = new Map();
    get length() {
        return this.store.size;
    }
    clear() {
        this.store.clear();
    }
    getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    }
    key(index) {
        return [...this.store.keys()][index] ?? null;
    }
    removeItem(key) {
        this.store.delete(key);
    }
    setItem(key, value) {
        this.store.set(key, String(value));
    }
}
const g = globalThis;
g.localStorage = new MemoryStorage();
// `typeof window === 'undefined'` guards flip to the browser path; `window`
// points at globalThis so `window.localStorage` resolves to the same store.
g.window = g;
// Libraries that treat `window` as a real browser (framer-motion's projection
// layer registers a resize listener while server-rendering) need these to exist.
// They are inert here: nothing in the node test environment fires DOM events.
g.addEventListener = g.addEventListener ?? (() => { });
g.removeEventListener = g.removeEventListener ?? (() => { });
