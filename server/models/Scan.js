import mongoose from "mongoose"

const ScanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    result: {
      prediction: {
        type: String,
        enum: ["Low Risk", "Medium Risk", "High Risk"],
        required: true,
      },
      confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high"],
        required: true,
      },
      details: {
        type: String,
        default: "",
      },
    },
    recommendations: [
      {
        type: String,
      },
    ],
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
)

const Scan = mongoose.model("Scan", ScanSchema)
export default Scan
