import express from "express";
import {
  isAuthenicated,
  login,
  logout,
  register,
  resetPassword,
  sendResetOtp,
  sendVerifyOtp,
  verifyEmail
} from "../controllers/auth.js";
import userAuth from "../middleware/userAuth.js"; // Your JWT middleware

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);   
authRouter.post('/verify-account', userAuth, verifyEmail);
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);
authRouter.get('/is-auth', userAuth, isAuthenicated);

export default authRouter;