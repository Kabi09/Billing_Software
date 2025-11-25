// routes/authRoute.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

const dotenv=require("dotenv")
dotenv.config()


const Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "Hello_World";
const SHOP_NAME=process.env.SHOP_NAME

// helper – create token
function createToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ----------------------
// SIGNUP – POST /api/auth/signup
// ----------------------
Router.post("/signup", async (req, res) => {
  try {
    const { name, phoneNumber, email, password, role } = req.body;

    if (!name || !phoneNumber || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, email and password are required",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    const user = new User({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim().toLowerCase(),
      password,
      // role from body only if explicitly "admin", otherwise employee
      role: role === "admin" ? "admin" : "employee",
    });

    await user.save();

    const token = createToken(user);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup error", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ----------------------
// LOGIN – POST /api/auth/login
// (email or phoneNumber + password)
// ----------------------
Router.post("/login", async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    // user can send { email, password } OR { phoneNumber, password }
    const loginInput = email || phoneNumber;

    if (!loginInput || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and password are required",
      });
    }

    const user = await User.findOne({
      $or: [
        { email: loginInput.toLowerCase().trim() },
        { phoneNumber: loginInput.trim() },
      ],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid login credentials",
      });
    }

    // comparePassword should be defined in userModel
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid login credentials",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ----------------------
// REQUEST RESET OTP – POST /api/auth/request-reset-otp
// ----------------------
Router.post("/request-reset-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "This email is not registered. Please sign up first.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    const html = `
      <p>Hi ${user.name || ""},</p>
      <p>Your password reset OTP is:</p>
      <h2>${otp}</h2>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `;

    await sendEmail(
      user.email,
      `Password Reset OTP - ${SHOP_NAME}`,
      html
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (err) {
    console.error("request-reset-otp error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Something went wrong, please try again",
    });
  }
});



// ----------------------
// RESET PASSWORD – POST /api/auth/reset-password
// ----------------------
Router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // check expiry
    if (user.resetOtpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (otp !== user.resetOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // --- FIX IS HERE ---
    // Don't use bcrypt.hash here. 
    // Just assign the plain password. The User model will hash it automatically.
    user.password = newPassword; 
    // -------------------

    // clear OTP fields
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;

    await user.save(); // The model hooks will hash the password here

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login.",
    });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again",
    });
  }
});

module.exports = Router;
