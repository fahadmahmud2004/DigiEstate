const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
  try {
    console.log(`[Password] Starting password hashing`);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`[Password] Password hashed successfully`);
    return hashedPassword;
  } catch (error) {
    console.error(`[Password] Error hashing password: ${error.message}`);
    console.error(`[Password] Error stack: ${error.stack}`);
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

const comparePassword = async (password, hashedPassword) => {
  try {
    console.log(`[Password] Starting password comparison`);
    console.log(`[Password] Plain password provided: ${password ? 'YES' : 'NO'}`);
    console.log(`[Password] Hashed password provided: ${hashedPassword ? 'YES' : 'NO'}`);
    
    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log(`[Password] Password comparison result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error(`[Password] Error comparing password: ${error.message}`);
    console.error(`[Password] Error stack: ${error.stack}`);
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

module.exports = {
  hashPassword,
  comparePassword
};