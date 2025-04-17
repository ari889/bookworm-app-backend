import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectedRoute = async (req, resizeBy, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ message: "Token is not valid" });

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protected route", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default protectedRoute;
