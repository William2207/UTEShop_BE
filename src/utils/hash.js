import bcrypt from "bcryptjs";

const SALT = 10;

export async function hash(data) {
  return bcrypt.hash(data, SALT);
}

export async function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

// Hoặc export as default object:
const bcryptUtils = {
  hash,
  compare,
};

export default bcryptUtils;
