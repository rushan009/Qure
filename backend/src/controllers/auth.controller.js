const User = require("../models/user.model");
const Doctor = require("../models/doctor.model");
const Patient = require("../models/patient.model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
async function register(req, res) {
  const { fullName, identifier, password, role } = req.body;

  try {
    if (!fullName || !identifier || !password) {
      return res
        .status(400)
        .json({ error: "Full name, identifier, and password are required" });
    }

    // Determine if identifier is email or phone
    const isEmail = identifier.includes("@");
    const query = isEmail
      ? { email: identifier.trim() }
      : { phone: identifier.trim() };

    // Check if user already exists
    const existingUser = await User.findOne(query);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data
    const userData = {
      fullName,
      password: hashedPassword,
      role,
      ...(isEmail
        ? { email: identifier.trim() }
        : { phone: identifier.trim() }),
    };

    // Doctor profile fields are optional during testing.
    // Keep fields in model and persist whatever is provided.
    if (role === "doctor" && req.body?.specialization) {
      userData.specialization = String(req.body.specialization).trim();
    }

    // Create user
    const newUser = await User.create(userData);

    // Create doctor document if role is doctor
    if (role === "doctor") {
      const { specialization, liscenceNumber, liscenceImage } = req.body;

      const doctorPayload = {
        user: newUser._id,
      };

      if (String(specialization || "").trim()) {
        doctorPayload.specialization = String(specialization).trim();
      }

      if (String(liscenceImage || "").trim()) {
        doctorPayload.liscenceImage = String(liscenceImage).trim();
      }

      if (
        liscenceNumber !== undefined &&
        liscenceNumber !== null &&
        String(liscenceNumber).trim() !== ""
      ) {
        const parsedLicense = Number(liscenceNumber);
        if (!Number.isNaN(parsedLicense)) {
          doctorPayload.liscenceNumber = parsedLicense;
        }
      }

      await Doctor.create({
        ...doctorPayload,
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
   res.cookie("token", token, {
  httpOnly: true,
  sameSite: "lax",
  secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // ← auto-detect
  maxAge: 60 * 60 * 1000,
});

    const newPatient = await Patient.create({
      user: newUser._id,
    });
    return res.status(201).json({
      message: "Registration successful",
      token,
      data: {
        userId: newUser._id,
        fullName: newUser.fullName,
        role: newUser.role,
        ...(isEmail ? { email: newUser.email } : { phone: newUser.phone }),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

const login = async (req, res) => {
  const { identifier, password } = req.body; // single field for email or phone

  try {
    const isEmail = identifier.includes("@");
    const query = isEmail ? { email: identifier } : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  res.cookie("token", token, {
  httpOnly: true,
  sameSite: "lax",
  secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // ← auto-detect
  maxAge: 60 * 60 * 1000,
});

    // Return user info
    return res.status(200).json({
      message: "Login successful",
      token,
      data: {
        userId: user._id,
        fullName: user.fullName,
        role: user.role,
        ...(isEmail ? { email: user.email } : { phone: user.phone }),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  register,
  login,
  logout,
};
