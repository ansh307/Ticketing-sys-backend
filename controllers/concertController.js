const Concert = require('../models/Concert');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');


// Get all concerts
exports.getConcerts = async (req, res) => {
  try {
    const { theaterId } = req.query;
    let filter = {};

    if (theaterId) {
      if (!mongoose.Types.ObjectId.isValid(theaterId)) {
        return res.status(400).json({ success: false, error: 'Invalid Theater ID format.' });
      }
      filter.theaterId = theaterId;
    }

    const concerts = await Concert.find(filter)
      .populate({
        path: 'theaterId',
        select: 'name city address',
      })
      .sort('startTime');

    return res.status(200).json({
      success: true,
      count: concerts.length,
      data: concerts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get concert by ID
exports.getConcertById = async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id).populate({
      path: 'theaterId',
      select: 'name city address eventKey pricing',
    });

    if (!concert) {
      return res.status(404).json({
        success: false,
        error: `Concert not found with id of ${req.params.id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: concert,
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Concert not found (Invalid ID format)' });
    }
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Create a concert
exports.createConcert = async (req, res) => {
  try {
    const { startTime, endTime, totalTickets, image, imageUrl, ...rest } = req.body;

    // --- Validate date range ---
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        error: "Concert end time must be after the start time.",
      });
    }

    let images = [];
    let finalImageUrl = null;

    // --- 1. PRIORITY: Multer uploaded file ---
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "concerts",
          resource_type: "image",
        });

        images.push({
          url: result.secure_url,
          publicId: result.public_id,
        });

        finalImageUrl = result.secure_url;

        // Delete temporary file
        const fs = require("fs");
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (uploadErr) {
        console.log("[Cloudinary Error]", uploadErr);
        return res.status(500).json({
          success: false,
          error: "Failed to upload file image to Cloudinary",
        });
      }
    }

    // --- 2. PRIORITY: Base64 image ---
    else if (image && image.startsWith("data:image")) {
      try {
        const result = await cloudinary.uploader.upload(image, {
          folder: "concerts",
        });

        images.push({
          url: result.secure_url,
          publicId: result.public_id,
        });

        finalImageUrl = result.secure_url;
      } catch (base64Err) {
        console.error("[Cloudinary Base64 Error]:", base64Err);
        return res.status(500).json({
          success: false,
          error: "Failed to upload Base64 image to Cloudinary",
        });
      }
    }

    // --- 3. Fallback: normal URL sent by user ---
    else if (imageUrl) {
      finalImageUrl = imageUrl;
    }

    // --- Create concert ---
    const concert = await Concert.create({
      ...rest,
      startTime,
      endTime,
      totalTickets: parseInt(totalTickets) || 0,
      availableTickets: parseInt(totalTickets) || 0,
      images,
      imageUrl: finalImageUrl,
    });

    const populated = await Concert.findById(concert._id).populate("theaterId");

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error("[CREATE ERROR]:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((e) => e.message).join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Server Error",
    });
  }
};



// Update a concert
exports.updateConcert = async (req, res) => {
  try {
    const {
      image,
      ...rest
    } = req.body;

    const updateData = { ...rest };

    // Find existing concert
    const existingConcert = await Concert.findById(req.params.id);
    if (!existingConcert) {
      return res.status(404).json({
        success: false,
        error: "Concert not found",
      });
    }

    if (image && image.startsWith("data:image")) {
      try {

        if (existingConcert.images?.length) {
          for (const img of existingConcert.images) {
            if (img.publicId) {
              await cloudinary.uploader.destroy(img.publicId);
            }
          }
        }

        // Upload new Base64 to Cloudinary
        const result = await cloudinary.uploader.upload(image, {
          folder: "concerts",
        });

        console.log(result.secure_url);

        updateData.images = [{
          url: result.secure_url,
          publicId: result.public_id,
        }];


      } catch (err) {
        console.error("[CLOUDINARY UPLOAD ERROR]:", err);
        return res.status(500).json({
          success: false,
          error: "Image upload failed.",
        });
      }
    }

    // Update availableTickets when totalTickets changes
    if (updateData.totalTickets !== undefined) {
      const newTotal = Number(updateData.totalTickets);
      const diff = newTotal - existingConcert.totalTickets;
      updateData.availableTickets = Math.max(
        0,
        existingConcert.availableTickets + diff
      );
    }

    // Update concert
    const concert = await Concert.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("theaterId");

    return res.status(200).json({
      success: true,
      data: concert,
    });

  } catch (error) {
    console.error("[UPDATE ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
};

// Delete a concert
exports.deleteConcert = async (req, res) => {
  try {
    const concert = await Concert.findByIdAndDelete(req.params.id);

    if (!concert) {
      return res.status(404).json({
        success: false,
        error: `Concert not found with id of ${req.params.id}`,
      });
    }

    // TODO: Delete associated Seats if needed
    return res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};
