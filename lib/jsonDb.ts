import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.json');

const DEFAULTS = {
    Admin: [],
    Client: [],
    Round: []
};

function ensureDb() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULTS, null, 2));
    }
}

function readDb() {
    ensureDb();
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return DEFAULTS;
    }
}

function writeDb(data: any) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const db = {
    get: (collection: string) => readDb()[collection] || [],
    save: (collection: string, items: any[]) => {
        const d = readDb();
        d[collection] = items;
        writeDb(d);
    }
};
