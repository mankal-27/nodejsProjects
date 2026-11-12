import { createStaticServer } from './server.js';

const [root = '.', port = '8080'] = process.argv.slice(2);
const server = createStaticServer({ root });
server.listen(Number(port), () => console.log(`Serving ${root} on http://localhost:${port}`));
// TODO stretch: graceful shutdown on SIGTERM/SIGINT
