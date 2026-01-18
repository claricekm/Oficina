const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');
const Workshop = require('../models/Workshop');

// Create booking (customer)
exports.createBooking = async (req, res) => {
  try {
    const { workshopId, vehicleId, serviceId, startTime, mechanicId } = req.body;

    // Validate vehicle belongs to user
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Veículo inválido' });
    }

    // Get service to calculate end time
    const service = await Service.findById(serviceId);
    if (!service || service.workshop.toString() !== workshopId) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    // Check if start time is in the past
    if (start < new Date()) {
      return res.status(400).json({ message: 'Não pode marcar no passado' });
    }

    // Check for mechanic conflicts (if mechanic is assigned)
    if (mechanicId) {
      const conflict = await Booking.findOne({
        mechanic: mechanicId,
        status: { $nin: ['cancelled', 'completed'] },
        $or: [
          { startTime: { $lt: end }, endTime: { $gt: start } }
        ]
      });

      if (conflict) {
        return res.status(409).json({ 
          message: 'Mecânico não disponível neste horário' 
        });
      }
    }

    // Create booking
    const booking = await Booking.create({
      workshop: workshopId,
      customer: req.user.id,
      mechanic: mechanicId || null,
      vehicle: vehicleId,
      service: serviceId,
      startTime: start,
      endTime: end,
      status: 'pending'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('workshop')
      .populate('service')
      .populate('vehicle')
      .populate('mechanic', 'name email');

    res.status(201).json({
      message: 'Marcação criada com sucesso',
      booking: populatedBooking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings (filtered by role)
exports.getBookings = async (req, res) => {
  try {
    let query = {};

    // Customer sees only their bookings
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }
    
    // Mechanic sees only their bookings
    if (req.user.role === 'mechanic') {
      query.mechanic = req.user.id;
    }
    
    // Admin sees all bookings from their workshop
    if (req.user.role === 'admin') {
      query.workshop = req.user.workshop;
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name email')
      .populate('mechanic', 'name email')
      .populate('vehicle')
      .populate('service')
      .populate('workshop')
      .sort({ startTime: -1 });

    res.json(bookings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('mechanic', 'name email')
      .populate('vehicle')
      .populate('service')
      .populate('workshop');
    
    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check permissions
    if (req.user.role === 'customer' && booking.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    if (req.user.role === 'mechanic' && booking.mechanic?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    res.json(booking);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking status (mechanic/admin)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Only mechanic assigned or admin can update
    const isAuthorized = 
      req.user.role === 'admin' && booking.workshop.toString() === req.user.workshop ||
      req.user.role === 'mechanic' && booking.mechanic?.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    if (status) booking.status = status;
    if (notes) booking.notes = notes;

    await booking.save();

    res.json({
      message: 'Marcação atualizada',
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking (customer or admin)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check permissions
    const canCancel = 
      req.user.role === 'customer' && booking.customer.toString() === req.user.id ||
      req.user.role === 'admin' && booking.workshop.toString() === req.user.workshop;

    if (!canCancel) {
      return res.status(403).json({ message: 'Sem permissão para cancelar' });
    }

    // Can't cancel if already completed
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Não pode cancelar marcação concluída' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      message: 'Marcação cancelada',
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign mechanic to booking (admin only)
exports.assignMechanic = async (req, res) => {
  try {
    const { mechanicId } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check if user is admin of this workshop
    if (req.user.role !== 'admin' || booking.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Check for mechanic conflicts
    const conflict = await Booking.findOne({
      mechanic: mechanicId,
      status: { $nin: ['cancelled', 'completed'] },
      $or: [
        { startTime: { $lt: booking.endTime }, endTime: { $gt: booking.startTime } }
      ]
    });

    if (conflict) {
      return res.status(409).json({ 
        message: 'Mecânico não disponível neste horário' 
      });
    }

    booking.mechanic = mechanicId;
    booking.status = 'confirmed';
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('mechanic', 'name email');

    res.json({
      message: 'Mecânico atribuído',
      booking: updatedBooking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
