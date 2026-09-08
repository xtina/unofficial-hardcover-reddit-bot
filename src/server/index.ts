import { createServer, getServerPort } from '@devvit/web/server';
import { app } from './app.js';

createServer(app).listen(getServerPort());
