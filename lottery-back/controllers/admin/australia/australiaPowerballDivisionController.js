const PowerballDivision = require("../../../models/australia/AustraliaPowerballDivision");

// ======================================================
// CREATE DIVISION
// ======================================================

exports.createDivision = async (req, res) => {
  try {
    const {
      division,
      main,
      powerball,
      prize,
      isActive,
    } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------

    if (
      division === undefined ||
      main === undefined ||
      powerball === undefined ||
      prize === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "division, main, powerball and prize are required.",
      });
    }

    if (Number(division) < 1) {
      return res.status(400).json({
        success: false,
        message: "Division must be greater than 0.",
      });
    }

    if (Number(main) < 0) {
      return res.status(400).json({
        success: false,
        message: "Main matches cannot be negative.",
      });
    }

    if (Number(prize) < 0) {
      return res.status(400).json({
        success: false,
        message: "Prize cannot be negative.",
      });
    }

    if (typeof powerball !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Powerball must be true or false.",
      });
    }

    // -----------------------------
    // Check duplicate division
    // -----------------------------

    const existingDivision =
      await PowerballDivision.findOne({
        division: Number(division),
      });

    if (existingDivision) {
      return res.status(400).json({
        success: false,
        message: `Division ${division} already exists.`,
      });
    }

    // -----------------------------
    // Create
    // -----------------------------

    const newDivision =
      await PowerballDivision.create({
        division: Number(division),
        main: Number(main),
        powerball,
        prize: Number(prize),
        isActive:
          isActive === undefined ? true : Boolean(isActive),
      });

    return res.status(201).json({
      success: true,
      message: "Powerball division created successfully.",
      division: newDivision,
    });
  } catch (error) {
    console.error(
      "Create Powerball Division Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ALL DIVISIONS
// ======================================================

exports.getAllDivisions = async (req, res) => {
  try {
    const divisions = await PowerballDivision.find()
      .sort({ division: 1 });

    return res.status(200).json({
      success: true,
      total: divisions.length,
      divisions,
    });
  } catch (error) {
    console.error(
      "Get Powerball Divisions Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ACTIVE DIVISIONS
// ======================================================

exports.getActiveDivisions = async (req, res) => {
  try {
    const divisions = await PowerballDivision.find({
      isActive: true,
    }).sort({ division: 1 });

    return res.status(200).json({
      success: true,
      total: divisions.length,
      divisions,
    });
  } catch (error) {
    console.error(
      "Get Active Powerball Divisions Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET DIVISION BY ID
// ======================================================

exports.getDivisionById = async (req, res) => {
  try {
    const { id } = req.params;

    const division =
      await PowerballDivision.findById(id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Powerball division not found.",
      });
    }

    return res.status(200).json({
      success: true,
      division,
    });
  } catch (error) {
    console.error(
      "Get Powerball Division Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE DIVISION
// ======================================================

exports.updateDivision = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      division,
      main,
      powerball,
      prize,
      isActive,
    } = req.body;

    const existing =
      await PowerballDivision.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Powerball division not found.",
      });
    }

    // -----------------------------
    // Validate values if provided
    // -----------------------------

    if (
      division !== undefined &&
      Number(division) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Division must be greater than 0.",
      });
    }

    if (
      main !== undefined &&
      Number(main) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Main matches cannot be negative.",
      });
    }

    if (
      prize !== undefined &&
      Number(prize) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Prize cannot be negative.",
      });
    }

    if (
      powerball !== undefined &&
      typeof powerball !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Powerball must be true or false.",
      });
    }

    // -----------------------------
    // Check duplicate division
    // -----------------------------

    if (
      division !== undefined &&
      Number(division) !== existing.division
    ) {
      const duplicate =
        await PowerballDivision.findOne({
          division: Number(division),
          _id: { $ne: id },
        });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Division ${division} already exists.`,
        });
      }
    }

    // -----------------------------
    // Update only supplied fields
    // -----------------------------

    if (division !== undefined) {
      existing.division = Number(division);
    }

    if (main !== undefined) {
      existing.main = Number(main);
    }

    if (powerball !== undefined) {
      existing.powerball = powerball;
    }

    if (prize !== undefined) {
      existing.prize = Number(prize);
    }

    if (isActive !== undefined) {
      existing.isActive = Boolean(isActive);
    }

    await existing.save();

    return res.status(200).json({
      success: true,
      message: "Powerball division updated successfully.",
      division: existing,
    });
  } catch (error) {
    console.error(
      "Update Powerball Division Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE DIVISION
// ======================================================

exports.deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;

    const division =
      await PowerballDivision.findById(id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Powerball division not found.",
      });
    }

    await division.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Powerball division deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Powerball Division Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// TOGGLE ACTIVE STATUS
// ======================================================

exports.toggleDivisionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const division =
      await PowerballDivision.findById(id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Powerball division not found.",
      });
    }

    division.isActive = !division.isActive;

    await division.save();

    return res.status(200).json({
      success: true,
      message: `Division ${
        division.isActive
          ? "activated"
          : "deactivated"
      } successfully.`,
      division,
    });
  } catch (error) {
    console.error(
      "Toggle Powerball Division Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};