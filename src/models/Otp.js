const { Schema, model } = require('mongoose');


const otpSchema = new Schema(
{
email: { type: String, required: true, lowercase: true },
codeHash: { type: String, required: true },
type: { type: String, enum: ['register', 'reset'], required: true },
expiresAt: { type: Date, required: true },
attempts: { type: Number, default: 0 },
},
{ timestamps: true }
);


otpSchema.index({ email: 1, type: 1 });


module.exports = model('Otp', otpSchema);