import '../../vercel-env.js';
import { createApp } from '../../dist/app.js';

// Explicit auth API entrypoint so nested /api/auth/* requests are routed
// to the Express application by Vercel.
export default createApp();
