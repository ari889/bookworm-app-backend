import express from "express";
import cloudinary from "../lib/cloudinary.js";
import protectedRoute from "../middlewares/auth.middleware.js";
import Book from "../models/Book.js";

const router = express.Router();

router.post("/", protectedRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    if (!image || !title || !caption || !rating) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });

    await newBook.save();

    res.status(200).json(newBook);
  } catch (error) {
    console.log("Error in book route", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Internal server error" });
  }
});

router.get("/", protectedRoute, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    const skip = (page - 1) * limit;
    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");
    const totalBooks = await Book.countDocuments();
    res.status(200).json({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in book route", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Internal server error" });
  }
});

router.delete("/:id", protectedRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);

    if (!book) return res.status(404).json({ message: "Book not found!" });
    if (book.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    await book.deleteOne();
    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.log("An error occurred", error);
    res.status(500).json({ message: error?.message || "Something went wrong" });
  }
});

router.get("/user", protectedRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(books);
  } catch (error) {
    console.log("Error in book route", error);
    res
      .status(500)
      .json({ message: error?.message ?? "Internal server error" });
  }
});

export default router;
