const Shift = require('../models/Shift');
const User = require('../models/User');

// Create shift (admin only)
exports.createShift = async (req, res) => {
  try {
    const { mechanicId, date, startTime, endTime, maxBookings } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Apenas admins podem criar turnos' });
    }

    // Verify mechanic belongs to same workshop
    const mechanic = await User.findById(mechanicId);
    if (!mechanic || mechanic.workshop.toString() !== req.user.workshop) {
      return res.status(400).json({ message: 'Mecânico inválido ou não pertence à sua oficina' });
    }

    // Check if shift already exists for this mechanic on this date
    const existingShift = await Shift.findOne({
      mechanic: mechanicId,
      date: new Date(date)
    });

    if (existingShift) {
      return res.status(400).json({ message: 'Já existe um turno para este mecânico nesta data' });
    }

    const shift = await Shift.create({
      workshop: req.user.workshop,
      mechanic: mechanicId,
      date: new Date(date),
      startTime,
      endTime,
      maxBookings
    });

    const populatedShift = await Shift.findById(shift._id)
      .populate('mechanic', 'name email')
      .populate('workshop', 'name');

    res.status(201).json({
      message: 'Turno criado com sucesso',
      shift: populatedShift
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shifts by workshop
exports.getShiftsByWorkshop = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { workshop: req.params.workshopId };

    // Filter by date range if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const shifts = await Shift.find(query)
      .populate('mechanic', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json(shifts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shifts by mechanic
exports.getShiftsByMechanic = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { mechanic: req.params.mechanicId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const shifts = await Shift.find(query)
      .populate('workshop', 'name address')
      .sort({ date: 1 });

    res.json(shifts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single shift
exports.getShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate('mechanic', 'name email')
      .populate('workshop', 'name address');
    
    if (!shift) {
      return res.status(404).json({ message: 'Turno não encontrado' });
    }

    res.json(shift);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update shift (admin only)
exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ message: 'Turno não encontrado' });
    }

    // Check if user is admin of this workshop
    if (req.user.role !== 'admin' || shift.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    const { startTime, endTime, maxBookings } = req.body;

    if (startTime) shift.startTime = startTime;
    if (endTime) shift.endTime = endTime;
    if (maxBookings) shift.maxBookings = maxBookings;

    await shift.save();

    res.json({
      message: 'Turno atualizado',
      shift
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete shift (admin only)
exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ message: 'Turno não encontrado' });
    }

    // Check permission
    if (req.user.role !== 'admin' || shift.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    await shift.deleteOne();

    res.json({ message: 'Turno apagado com sucesso' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
