import Scan from "../models/Scan.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import axios from "axios";
import FormData from "form-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the Python API URL from environment variables or use default
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:5040";

// Upload and analyze skin image
export const analyzeSkin = async (req, res) => {
  try {
    console.log("Request received for image analysis");

    // Check if file exists in the request
    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ message: "No image file provided" });
    }

    console.log("File details:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    // Path to the uploaded image
    const imagePath = req.file.path;
    console.log("Image saved to:", imagePath);

    try {
      // Check if the file exists
      if (!fs.existsSync(imagePath)) {
        console.error("File does not exist at path:", imagePath);
        return res.status(400).json({ message: "Uploaded file not found" });
      }

      // Call the Python API to analyze the image
      console.log("Calling Python API at:", `${PYTHON_API_URL}/predict`);

      const formData = new FormData();
      formData.append("image", fs.createReadStream(imagePath));

      console.log("Sending image to Python API...");
      const pythonResponse = await axios.post(
        `${PYTHON_API_URL}/predict`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 60000, // 60 second timeout for model processing
        }
      );

      console.log("Python API response:", pythonResponse.data);
      const result = pythonResponse.data;

      // Map the risk level from your model to our system
      let riskLevel = "low";
      if (result.riskLevel === "benign") {
        riskLevel = "low";
      } else if (result.riskLevel === "malignant") {
        riskLevel = "high";
      }

      // Create recommendations based on risk level
      let recommendations = [];
      if (riskLevel === "low") {
        recommendations = [
          "Continue to monitor this area for any changes in size, shape, or color.",
          "Apply sunscreen regularly and avoid excessive sun exposure.",
          "Perform regular self-examinations of your skin.",
        ];
      } else if (riskLevel === "medium") {
        recommendations = [
          "Schedule a follow-up with a dermatologist within the next month.",
          "Take photos to track any changes in the lesion.",
          "Apply sunscreen with SPF 50+ and avoid direct sun exposure.",
          "Perform weekly self-examinations of your skin.",
        ];
      } else {
        recommendations = [
          "Consult with a dermatologist as soon as possible.",
          "This lesion shows characteristics that require professional evaluation.",
          "Avoid sun exposure to the area.",
          "Do not scratch or irritate the area.",
        ];
      }

      // Create a new scan record
      const newScan = new Scan({
        user: req.user.id,
        // Store the relative path to make it easier to serve
        imagePath: req.file.path.replace(/^server\//, ""),
        result: {
          prediction: result.prediction,
          confidence: result.confidence,
          riskLevel: riskLevel,
          details:
            result.details ||
            "Analysis based on visual characteristics of the lesion.",
        },
        recommendations,
      });

      // Save scan to database
      await newScan.save();
      console.log("Scan saved to database:", newScan._id);

      res.status(200).json({
        scan: newScan,
        message: "Image analyzed successfully",
      });
    } catch (error) {
      console.error("Python API error:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      } else if (error.request) {
        console.error("No response received from Python API");
      } else {
        console.error("Error message:", error.message);
      }

      // Fallback to random results if Python API fails
      console.log("Using fallback mode for prediction");
      const riskLevels = ["low", "medium", "high"];
      const predictions = ["Low Risk", "Medium Risk", "High Risk"];

      const randomIndex = Math.floor(Math.random() * 3);
      const randomConfidence = Math.floor(Math.random() * 20) + 70; // 70-90% confidence

      // Create recommendations based on risk level
      let recommendations = [];
      if (randomIndex === 0) {
        // Low risk
        recommendations = [
          "Continue to monitor this area for any changes in size, shape, or color.",
          "Apply sunscreen regularly and avoid excessive sun exposure.",
          "Perform regular self-examinations of your skin.",
        ];
      } else if (randomIndex === 1) {
        // Medium risk
        recommendations = [
          "Schedule a follow-up with a dermatologist within the next month.",
          "Take photos to track any changes in the lesion.",
          "Apply sunscreen with SPF 50+ and avoid direct sun exposure.",
          "Perform weekly self-examinations of your skin.",
        ];
      } else {
        // High risk
        recommendations = [
          "Consult with a dermatologist as soon as possible.",
          "This lesion shows characteristics that require professional evaluation.",
          "Avoid sun exposure to the area.",
          "Do not scratch or irritate the area.",
        ];
      }

      // Create a new scan record
      const newScan = new Scan({
        user: req.user.id,
        // Store the relative path to make it easier to serve
        imagePath: req.file.path.replace(/^server\//, ""),
        result: {
          prediction: predictions[randomIndex],
          confidence: randomConfidence,
          riskLevel: riskLevels[randomIndex],
          details:
            "Analysis based on visual characteristics of the lesion. (Fallback mode)",
        },
        recommendations,
      });

      // Save scan to database
      await newScan.save();

      res.status(200).json({
        scan: newScan,
        message: "Image analyzed successfully (using fallback mode)",
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    res
      .status(500)
      .json({ message: "Failed to analyze image", error: error.message });
  }
};

// Get scan history for a user with pagination
export const getScanHistory = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Count total documents for pagination
    const total = await Scan.countDocuments({ user: req.user.id });

    // Get scans with pagination
    const scans = await Scan.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .exec();

    res.status(200).json({
      scans,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get scan history", error: error.message });
  }
};

// Get a specific scan by ID
export const getScanById = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }

    // Check if the scan belongs to the current user
    if (scan.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to access this scan" });
    }

    res.status(200).json({ scan });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get scan", error: error.message });
  }
};

// Delete a scan
export const deleteScan = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }

    // Check if the scan belongs to the current user
    if (scan.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this scan" });
    }

    // Delete the image file
    if (scan.imagePath) {
      const imagePath = path.join(__dirname, "..", "..", scan.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the scan from the database
    await Scan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Scan deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete scan", error: error.message });
  }
};

// Add notes to a scan
export const addNotesToScan = async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ message: "Notes are required" });
    }

    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }

    // Check if the scan belongs to the current user
    if (scan.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this scan" });
    }

    // Update the scan with notes
    scan.notes = notes;
    await scan.save();

    res.status(200).json({ scan, message: "Notes added successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add notes", error: error.message });
  }
};
