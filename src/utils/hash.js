const bcrypt = require('bcryptjs');
const SALT = 10;


async function hash(data) {
return bcrypt.hash(data, SALT);
}
async function compare(plain, hashed) {
return bcrypt.compare(plain, hashed);
}
module.exports = { hash, compare };