import express from "express";
import {
  analyzeSkin,
  getScanHistory,
  getScanById,
  deleteScan,
  addNotesToScan,
} from "../controllers/scans.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer storage directly in the route file for better control
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "server/uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    console.log(
      "Multer processing file:",
      file.originalname,
      "mimetype:",
      file.mimetype
    );

    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files (jpeg, jpg, png) are allowed!"));
  },
});

// Upload and analyze skin image
router.post(
  "/analyze",
  (req, res, next) => {
    console.log("Received request to /api/scans/analyze");
    console.log("Request headers:", req.headers);

    // Use multer directly here instead of req.app.locals.upload
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        console.error("No file uploaded");
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log("File uploaded successfully:", req.file);
      next();
    });
  },
  analyzeSkin
);

// Get scan history for a user
router.get("/history", getScanHistory);

// Get a specific scan by ID
router.get("/:id", getScanById);

// Delete a scan
router.delete("/:id", deleteScan);

// Add notes to a scan
router.put("/:id/notes", addNotesToScan);

export default router;
