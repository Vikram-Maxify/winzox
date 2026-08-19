const CanadaPowerballDivision = require(
  "../../../models/canada/CanadaPowerballDivision"
);

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

    // ============================
    // VALIDATION
    // ============================

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

    // ============================
    // DUPLICATE DIVISION
    // ============================

    const existingDivision =
      await CanadaPowerballDivision.findOne({
        division: Number(division),
      });

    if (existingDivision) {
      return res.status(400).json({
        success: false,
        message: `Division ${division} already exists.`,
      });
    }

    // ============================
    // CREATE
    // ============================

    const newDivision =
      await CanadaPowerballDivision.create({
        division: Number(division),
        main: Number(main),
        powerball,
        prize: Number(prize),
        isActive:
          isActive === undefined
            ? true
            : Boolean(isActive),
      });

    return res.status(201).json({
      success: true,
      message:
        "Canada Powerball division created successfully.",
      division: newDivision,
    });
  } catch (error) {
    console.error(
      "Create Canada Powerball Division Error:",
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
    const divisions =
      await CanadaPowerballDivision.find().sort({
        division: 1,
      });

    return res.status(200).json({
      success: true,
      total: divisions.length,
      divisions,
    });
  } catch (error) {
    console.error(
      "Get Canada Powerball Divisions Error:",
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
    const divisions =
      await CanadaPowerballDivision.find({
        isActive: true,
      }).sort({
        division: 1,
      });

    return res.status(200).json({
      success: true,
      total: divisions.length,
      divisions,
    });
  } catch (error) {
    console.error(
      "Get Active Canada Powerball Divisions Error:",
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
      await CanadaPowerballDivision.findById(id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Canada Powerball division not found.",
      });
    }

    return res.status(200).json({
      success: true,
      division,
    });
  } catch (error) {
    console.error(
      "Get Canada Powerball Division Error:",
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
      await CanadaPowerballDivision.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Canada Powerball division not found.",
      });
    }

    // ============================
    // VALIDATION
    // ============================

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

    // ============================
    // DUPLICATE DIVISION
    // ============================

    if (
      division !== undefined &&
      Number(division) !== existing.division
    ) {
      const duplicate =
        await CanadaPowerballDivision.findOne({
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

    // ============================
    // UPDATE
    // ============================

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
      message:
        "Canada Powerball division updated successfully.",
      division: existing,
    });
  } catch (error) {
    console.error(
      "Update Canada Powerball Division Error:",
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
      await CanadaPowerballDivision.findById(id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Canada Powerball division not found.",
      });
    }

    await division.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Canada Powerball division deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Canada Powerball Division Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// TOGGLE ACTIVE / INACTIVE
// ======================================================

exports.toggleDivisionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const division =
      await CanadaPowerballDivision.findById(id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Canada Powerball division not found.",
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
      "Toggle Canada Powerball Division Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};