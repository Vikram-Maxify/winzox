const mongoose = require("mongoose");

const NepalPowerballDivision = require("../../../models/nepal/NepalPowerballDivision");

exports.createDivision = async (req, res) => {
  try {
    const { division, main, powerball, prize, isActive } = req.body;

    if (
      division === undefined ||
      main === undefined ||
      powerball === undefined ||
      prize === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "division, main, powerball and prize are required.",
      });
    }

    if (Number.isNaN(Number(division)) || Number(division) < 1) {
      return res.status(400).json({
        success: false,
        message: "Division must be a valid number greater than 0.",
      });
    }

    if (Number.isNaN(Number(main)) || Number(main) < 0) {
      return res.status(400).json({
        success: false,
        message: "Main matches must be a valid number.",
      });
    }

    if (Number.isNaN(Number(prize)) || Number(prize) < 0) {
      return res.status(400).json({
        success: false,
        message: "Prize must be a valid number.",
      });
    }

    if (typeof powerball !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Powerball must be true or false.",
      });
    }

    const existingDivision = await NepalPowerballDivision.findOne({
      division: Number(division),
    });

    if (existingDivision) {
      return res.status(400).json({
        success: false,
        message: `Division ${division} already exists.`,
      });
    }

    const newDivision = await NepalPowerballDivision.create({
      division: Number(division),
      main: Number(main),
      powerball,
      prize: Number(prize),
      isActive: isActive === undefined ? true : Boolean(isActive),
    });

    return res.status(201).json({
      success: true,
      message: "Nepal Powerball division created successfully.",
      division: newDivision,
    });
  } catch (error) {
    console.error("Create Nepal Powerball Division Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This division already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllDivisions = async (req, res) => {
  try {
    const divisions = await NepalPowerballDivision.find().sort({ division: 1 }).lean();

    return res.status(200).json({
      success: true,
      total: divisions.length,
      divisions,
    });
  } catch (error) {
    console.error("Get Nepal Powerball Divisions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getActiveDivisions = async (req, res) => {
  try {
    const divisions = await NepalPowerballDivision.find({ isActive: true })
      .sort({ division: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: divisions.length,
      divisions,
    });
  } catch (error) {
    console.error("Get Active Nepal Powerball Divisions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDivisionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid division ID.",
      });
    }

    const division = await NepalPowerballDivision.findById(id).lean();

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Nepal Powerball division not found.",
      });
    }

    return res.status(200).json({
      success: true,
      division,
    });
  } catch (error) {
    console.error("Get Nepal Powerball Division Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDivision = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid division ID.",
      });
    }

    const { division, main, powerball, prize, isActive } = req.body;

    const existing = await NepalPowerballDivision.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Nepal Powerball division not found.",
      });
    }

    if (
      division !== undefined &&
      (Number.isNaN(Number(division)) || Number(division) < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "Division must be a valid number greater than 0.",
      });
    }

    if (
      main !== undefined &&
      (Number.isNaN(Number(main)) || Number(main) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Main matches must be a valid number.",
      });
    }

    if (
      prize !== undefined &&
      (Number.isNaN(Number(prize)) || Number(prize) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Prize must be a valid number.",
      });
    }

    if (powerball !== undefined && typeof powerball !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Powerball must be true or false.",
      });
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    if (
      division !== undefined &&
      Number(division) !== existing.division
    ) {
      const duplicate = await NepalPowerballDivision.findOne({
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

    if (division !== undefined) existing.division = Number(division);
    if (main !== undefined) existing.main = Number(main);
    if (powerball !== undefined) existing.powerball = powerball;
    if (prize !== undefined) existing.prize = Number(prize);
    if (isActive !== undefined) existing.isActive = isActive;

    await existing.save();

    return res.status(200).json({
      success: true,
      message: "Nepal Powerball division updated successfully.",
      division: existing,
    });
  } catch (error) {
    console.error("Update Nepal Powerball Division Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This division already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid division ID.",
      });
    }

    const division = await NepalPowerballDivision.findById(id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Nepal Powerball division not found.",
      });
    }

    await division.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Nepal Powerball division deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Nepal Powerball Division Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.toggleDivisionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid division ID.",
      });
    }

    const division = await NepalPowerballDivision.findById(id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Nepal Powerball division not found.",
      });
    }

    division.isActive = !division.isActive;
    await division.save();

    return res.status(200).json({
      success: true,
      message: `Division ${
        division.isActive ? "activated" : "deactivated"
      } successfully.`,
      division,
    });
  } catch (error) {
    console.error("Toggle Nepal Powerball Division Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
