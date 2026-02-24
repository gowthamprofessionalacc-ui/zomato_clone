const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const verifyOTP = (storedOTP, providedOTP) => {
  return storedOTP === providedOTP;
};

module.exports = { generateOTP, verifyOTP };
