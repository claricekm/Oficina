const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');
const Workshop = require('../models/Workshop');

// Check availability for a specific date and services
exports.checkAvailability = async (req, res) => {
  try {
    const { workshopId, date, serviceIds } = req.body;

    // Validate required fields
    if (!workshopId || !date || !serviceIds || serviceIds.length === 0) {
      return res.status(400).json({ 
        message: 'Workshop, data e serviços são obrigatórios' 
      });
    }

    // Get workshop data
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Oficina não encontrada' });
    }

    // Get services and calculate total duration
    const services = await Service.find({ _id: { $in: serviceIds } });
    if (services.length === 0) {
      return res.status(404).json({ message: 'Serviços não encontrados' });
    }

    const totalDuration = services.reduce((sum, service) => sum + service.durationMinutes, 0);

    // Set date range (start of day to start of next day)
    const requestedDate = new Date(date);
    requestedDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(requestedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get existing bookings for this date
    const existingBookings = await Booking.find({
      workshop: workshopId,
      startTime: {
        $gte: requestedDate,
        $lt: nextDay
      },
      status: { $nin: ['cancelled', 'completed'] }
    });

    // Parse workshop opening hours
    const [startHour, startMinute] = workshop.openingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workshop.openingHours.end.split(':').map(Number);

    // Generate available time slots
    const availableSlots = [];
    let currentTime = startHour * 60 + startMinute; // Convert to minutes
    const closeTime = endHour * 60 + endMinute;

    // Loop through day in 30-minute intervals
    while (currentTime + totalDuration <= closeTime) {
      const slotHour = Math.floor(currentTime / 60);
      const slotMinute = currentTime % 60;
      const timeString = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;

      // Create Date objects for slot start and end
      const slotStart = new Date(requestedDate);
      slotStart.setHours(slotHour, slotMinute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + totalDuration);

      // Check for conflicting bookings
      const conflictingBookings = existingBookings.filter(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        // Check if times overlap
        return (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        );
      });

      // Calculate available spots
      const spotsLeft = workshop.maxSlotsPerHour - conflictingBookings.length;

      // Add slot if available
      if (spotsLeft > 0) {
        availableSlots.push({
          time: timeString,
          available: true,
          spotsLeft
        });
      }

      currentTime += 30; // Next slot (30 minutes later)
    }

    res.json({
      date: requestedDate,
      totalDuration,
      availableSlots
    });

  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar disponibilidade',
      error: error.message 
    });
  }
};

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

module.exports = exports;
