import { createChatServer } from './server.js';
const port = Number(process.env.PORT ?? 3002);
createChatServer().listen(port, () => console.log(`chat on ws://localhost:${port}/ws?room=lobby&user=you`));
