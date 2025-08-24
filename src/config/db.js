const mongoose = require('mongoose');


module.exports = async () => {
const uri = process.env.MONGO_URI;
if (!uri) throw new Error('MONGO_URI missing');
await mongoose.connect(uri, { autoIndex: true });
console.log('Mongo connected');
};