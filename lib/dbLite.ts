import { db } from './jsonDb';

function matches(item: any, query: any) {
    if (!query || typeof query !== 'object') return true;
    return Object.keys(query).every(k => {
        if (typeof query[k] === 'object' && query[k] !== null) return true; // Skip complex queries for now
        return item[k] === query[k];
    });
}

function createInstance(name: string, data: any) {
    const _id = data._id || Math.random().toString(36).substring(2, 10);
    const obj = { ...data, _id };

    // Add save method
    Object.defineProperty(obj, 'save', {
        value: async function () {
            const items = db.get(name);
            const idx = items.findIndex((i: any) => i._id === this._id);
            
            // Create a clean snapshot with all properties
            const snapshot: any = { _id: this._id };
            for (const key in this) {
                if (key !== 'save' && key !== 'toObject') {
                    snapshot[key] = this[key];
                }
            }

            if (idx >= 0) {
                items[idx] = snapshot;
            } else {
                items.push(snapshot);
            }

            db.save(name, items);
            return this;
        },
        writable: true, enumerable: false, configurable: true
    });
    
    // Add toObject method
    Object.defineProperty(obj, 'toObject', {
        value: function () {
            const result: any = {};
            for (const key in this) {
                if (this.hasOwnProperty(key)) {
                    result[key] = this[key];
                }
            }
            return result;
        },
        writable: true, enumerable: false, configurable: true
    });
    
    return obj;
}

export function createModel(name: string) {
    return {
        findOne: async (query: any) => {
            const items = db.get(name);
            const found = items.find((i: any) => matches(i, query));
            return found ? createInstance(name, found) : null;
        },
        find: async (query: any = {}) => {
            const items = db.get(name);
            const res = items.filter((i: any) => matches(i, query));
            // Sort? Maybe by score if Client?
            if (name === 'Client') {
                res.sort((a: any, b: any) => (b.totalScore || 0) - (a.totalScore || 0));
            }
            return res.map((r: any) => createInstance(name, r));
        },
        create: async (data: any) => {
            const inst = createInstance(name, data);
            await inst.save();
            return inst;
        },
        countDocuments: async () => {
            return db.get(name).length;
        },
        deleteMany: async () => {
            db.save(name, []);
        },
        deleteOne: async (query: any) => {
            const items = db.get(name);
            const newItems = items.filter((i: any) => !matches(i, query));
            db.save(name, newItems);
        },
        findOneAndUpdate: async (query: any, update: any, options: any = {}) => {
            const items = db.get(name);
            const idx = items.findIndex((i: any) => matches(i, query));
            
            if (idx >= 0) {
                // Apply updates
                const updated = { ...items[idx], ...update };
                items[idx] = updated;
                db.save(name, items);
                return options.new ? createInstance(name, updated) : createInstance(name, items[idx]);
            }
            
            return null;
        }
    };
}
