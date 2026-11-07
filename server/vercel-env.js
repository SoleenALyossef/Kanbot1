// Must be imported BEFORE the app: Vercel's filesystem is read-only except /tmp.
process.env.DATA_FILE ??= '/tmp/data/db.json';
