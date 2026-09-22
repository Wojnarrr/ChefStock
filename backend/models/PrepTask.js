const mongoose = require("mongoose");

const prepTaskSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        prepDate: {
            type: Date,
            default: Date.now,
        },

        taskName: {
            type: String,
            required: [true, "Task name is required"],
            trim: true,
            maxlength: [150, "Task name cannot exceed 150 characters"],
        },

        linkedRecipe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recipe",
            default: null,
        },

        targetQuantity: {
            type: Number,
            default: null,
            min: 0,
        },

        assignedTo: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: String,
            enum: ["pending", "in_progress", "done"],
            default: "pending",
        },

        dueTime: {
            type: String,
            trim: true,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        completedAt: {
            type: Date,
            default: null,
        },

        linkedPrepBatch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PrepBatch",
            default: null,
        },
    },
    { timestamps: true }
);

prepTaskSchema.pre("validate", function () {
    if (this.linkedRecipe && !this.targetQuantity) {
        this.invalidate(
            "targetQuantity",
            "A target quantity is required when a task is linked to a recipe."
        );
    }
});
prepTaskSchema.index({ restaurant: 1, isActive: 1 });

module.exports = mongoose.model("PrepTask", prepTaskSchema);