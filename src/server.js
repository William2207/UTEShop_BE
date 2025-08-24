require('dotenv').config();
const app = require('./app');
const connect = require('./config/db');


const PORT = process.env.PORT || 5000;


(async () => {
await connect();
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
})();