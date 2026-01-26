const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');
const Workshop = require('../models/Workshop');
const User = require('../models/User');
const Review = require('../models/Review');

// Constants
const MAX_WEEKLY_HOURS = 40;
const MIN_HOURS_NOTICE = 48; // Minimum hours in advance for booking

// Helper: Get start and end of current week (Monday to Sunday)
const getWeekBounds = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start

  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return { weekStart, weekEnd };
};

// Helper: Calculate mechanic's weekly hours
const getMechanicWeeklyHours = async (mechanicId, weekStart, weekEnd) => {
  const bookings = await Booking.find({
    mechanic: mechanicId,
    status: { $nin: ['cancelled'] },
    startTime: { $gte: weekStart, $lt: weekEnd }
  }).populate('service');

  const totalMinutes = bookings.reduce((sum, booking) => {
    return sum + (booking.service?.durationMinutes || 0);
  }, 0);

  return totalMinutes / 60; // Return hours
};

// Helper: Check if date is weekend (Saturday=6, Sunday=0)
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

// Helper: Get workshop ID as string (handles both ObjectId and populated object)
const getWorkshopId = (workshop) => {
  if (!workshop) return '';
  if (typeof workshop === 'object' && workshop._id) {
    return workshop._id.toString();
  }
  return workshop.toString();
};

// Helper: Check if booking meets minimum notice requirement
const meetsMinimumNotice = (startTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const hoursUntilBooking = (start - now) / (1000 * 60 * 60);
  return hoursUntilBooking >= MIN_HOURS_NOTICE;
};

// Helper: Auto-complete expired bookings
const autoCompleteExpiredBookings = async (workshopId) => {
  const now = new Date();

  const result = await Booking.updateMany(
    {
      workshop: workshopId,
      status: { $in: ['confirmed', 'in_progress'] },
      endTime: { $lte: now }
    },
    {
      $set: {
        status: 'completed',
        autoCompleted: true,
        autoCompletedAt: now
      }
    }
  );

  return result.modifiedCount;
};

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

    // Check if requested date is a weekend
    if (isWeekend(date)) {
      return res.status(400).json({
        message: 'Não aceitamos marcações nos fins de semana (Sábado e Domingo)',
        isWeekend: true
      });
    }

    // Check minimum notice (48h) - only for the date itself, time slot check comes later
    const requestedDate = new Date(date);
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + MIN_HOURS_NOTICE);

    if (requestedDate < minDate.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        message: `Marcações requerem um mínimo de ${MIN_HOURS_NOTICE} horas de antecedência`,
        minNoticeHours: MIN_HOURS_NOTICE
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
    // requestedDate already declared above, just reset hours
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
// Note: Transactions require MongoDB replica set. For standalone, we use atomic operations.
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

    // Get workshop to check slot availability
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Oficina não encontrada' });
    }

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    // Check if start time is in the past
    if (start < new Date()) {
      return res.status(400).json({ message: 'Não pode marcar no passado' });
    }

    // Check if booking date is weekend
    if (isWeekend(start)) {
      return res.status(400).json({
        message: 'Não aceitamos marcações nos fins de semana (Sábado e Domingo)'
      });
    }

    // Check minimum notice - use service.minAdvanceTime if available, else default
    const minAdvanceHours = service.minAdvanceTime || MIN_HOURS_NOTICE;
    const now = new Date();
    const hoursUntilBooking = (start - now) / (1000 * 60 * 60);
    if (hoursUntilBooking < minAdvanceHours) {
      return res.status(400).json({
        message: `Marcações requerem um mínimo de ${minAdvanceHours} horas de antecedência`
      });
    }

    // Check slot availability
    const activeBookingsCount = await Booking.countDocuments({
      workshop: workshopId,
      status: { $nin: ['cancelled', 'completed'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (activeBookingsCount >= workshop.maxSlotsPerHour) {
      return res.status(409).json({
        message: 'Não há vagas disponíveis para este horário',
        spotsAvailable: 0
      });
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

    // Create booking with estimatedPrice from service
    const booking = await Booking.create({
      workshop: workshopId,
      customer: req.user.id,
      mechanic: mechanicId || null,
      vehicle: vehicleId,
      service: serviceId,
      startTime: start,
      endTime: end,
      status: 'pending',
      estimatedPrice: service.price,  // Set estimated price from service
      customerNotes: req.body.customerNotes || null
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
      // Auto-complete expired bookings for this workshop
      await autoCompleteExpiredBookings(req.user.workshop);
    }

    // For mechanics, also auto-complete their expired bookings
    if (req.user.role === 'mechanic') {
      const now = new Date();
      await Booking.updateMany(
        {
          mechanic: req.user.id,
          status: { $in: ['confirmed', 'in_progress'] },
          endTime: { $lte: now }
        },
        {
          $set: {
            status: 'completed',
            autoCompleted: true,
            autoCompletedAt: now
          }
        }
      );
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name email')
      .populate('mechanic', 'name email')
      .populate('vehicle')
      .populate('service')
      .populate('workshop')
      .sort({ startTime: -1 });

    // For mechanics, categorize bookings
    if (req.user.role === 'mechanic') {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const categorized = {
        active: bookings.filter(b =>
          b.status !== 'completed' &&
          b.status !== 'cancelled' &&
          new Date(b.startTime) <= now &&
          new Date(b.endTime) > now
        ),
        future: bookings.filter(b =>
          b.status !== 'completed' &&
          b.status !== 'cancelled' &&
          new Date(b.startTime) > now
        ),
        completed: bookings.filter(b => b.status === 'completed')
      };

      return res.json({
        bookings,
        categorized,
        counts: {
          active: categorized.active.length,
          future: categorized.future.length,
          completed: categorized.completed.length
        }
      });
    }

    res.json(bookings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get mechanics with weekly availability (admin only)
exports.getMechanicsAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    const { bookingDate } = req.query;
    const targetDate = bookingDate ? new Date(bookingDate) : new Date();
    const { weekStart, weekEnd } = getWeekBounds(targetDate);

    // Get all mechanics for this workshop
    const mechanics = await User.find({
      workshop: req.user.workshop,
      role: 'mechanic'
    }).select('name email');

    // Calculate weekly hours for each mechanic
    const mechanicsWithAvailability = await Promise.all(
      mechanics.map(async (mechanic) => {
        const weeklyHours = await getMechanicWeeklyHours(mechanic._id, weekStart, weekEnd);
        const availableHours = MAX_WEEKLY_HOURS - weeklyHours;

        return {
          _id: mechanic._id,
          name: mechanic.name,
          email: mechanic.email,
          weeklyHours: Math.round(weeklyHours * 10) / 10,
          availableHours: Math.round(availableHours * 10) / 10,
          maxHours: MAX_WEEKLY_HOURS,
          canAcceptMore: availableHours > 0
        };
      })
    );

    res.json({
      mechanics: mechanicsWithAvailability,
      weekStart,
      weekEnd
    });

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

    // Check if booking has a review (for completed bookings)
    let hasReview = false;
    if (booking.status === 'completed') {
      const existingReview = await Review.findOne({ booking: booking._id });
      hasReview = !!existingReview;
    }

    // Return booking with hasReview flag
    res.json({
      ...booking.toObject(),
      hasReview
    });

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
    const bookingWorkshopId = getWorkshopId(booking.workshop);
    const userWorkshopId = getWorkshopId(req.user.workshop);
    const isAuthorized =
      (req.user.role === 'admin' && bookingWorkshopId === userWorkshopId) ||
      (req.user.role === 'mechanic' && booking.mechanic?.toString() === req.user.id);

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
    const { reason, notes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check permissions and determine who is cancelling
    const bookingWorkshopId = getWorkshopId(booking.workshop);
    const userWorkshopId = getWorkshopId(req.user.workshop);
    const isCustomer = req.user.role === 'customer' && booking.customer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin' && bookingWorkshopId === userWorkshopId;

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({ message: 'Sem permissão para cancelar' });
    }

    // Can't cancel if already completed
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Não pode cancelar marcação concluída' });
    }

    // Can't cancel if already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Marcação já foi cancelada' });
    }

    // Customer can only cancel pending, awaiting_approval states
    // Admin can cancel more states (except completed)
    if (isCustomer && !['pending', 'awaiting_approval'].includes(booking.status)) {
      return res.status(400).json({
        message: `Cliente não pode cancelar marcação com estado "${booking.status}". Contacte a oficina.`
      });
    }

    // Determine cancellation reason
    let cancellationReason = reason;
    if (!cancellationReason) {
      // Default reasons based on context
      if (booking.status === 'awaiting_approval' && isCustomer) {
        cancellationReason = 'price_rejected';
      } else if (isCustomer) {
        cancellationReason = 'customer_request';
      } else {
        cancellationReason = 'admin_decision';
      }
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancelledBy = req.user.id;
    booking.cancelledAt = new Date();
    booking.cancellationReason = cancellationReason;
    if (notes) booking.cancellationNotes = notes;

    await booking.save();

    // Populate for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('cancelledBy', 'name email role');

    res.json({
      message: 'Marcação cancelada',
      booking: populatedBooking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recently completed bookings for customer (for polling)
exports.getRecentlyCompletedBookings = async (req, res) => {
  try {
    // Only customers can use this endpoint
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Apenas clientes podem aceder a este endpoint' });
    }

    const { since } = req.query;
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    const bookings = await Booking.find({
      customer: req.user.id,
      status: 'completed',
      $or: [
        { autoCompletedAt: { $gte: sinceDate } },
        { updatedAt: { $gte: sinceDate }, autoCompleted: { $ne: true } }
      ]
    })
      .populate('workshop', 'name')
      .populate('service', 'name')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ updatedAt: -1 });

    res.json({
      bookings,
      count: bookings.length,
      since: sinceDate
    });

  } catch (error) {
    console.error('Erro ao obter marcações concluídas:', error);
    res.status(500).json({ message: error.message });
  }
};

// Assign mechanic to booking (admin only)
exports.assignMechanic = async (req, res) => {
  try {
    const { mechanicId } = req.body;

    const booking = await Booking.findById(req.params.id).populate('service');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check if user is admin of this workshop
    const bookingWorkshopId = getWorkshopId(booking.workshop);
    const userWorkshopId = getWorkshopId(req.user.workshop);

    if (req.user.role !== 'admin' || bookingWorkshopId !== userWorkshopId) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Check for mechanic time slot conflicts
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
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

    // Check 40h/week limit
    const { weekStart, weekEnd } = getWeekBounds(booking.startTime);
    const currentWeeklyHours = await getMechanicWeeklyHours(mechanicId, weekStart, weekEnd);
    const serviceDurationHours = (booking.service?.durationMinutes || 0) / 60;

    if (currentWeeklyHours + serviceDurationHours > MAX_WEEKLY_HOURS) {
      return res.status(400).json({
        message: `Mecânico excederia o limite de ${MAX_WEEKLY_HOURS}h semanais. Horas atuais: ${currentWeeklyHours.toFixed(1)}h, Serviço: ${serviceDurationHours.toFixed(1)}h`,
        currentHours: currentWeeklyHours,
        serviceHours: serviceDurationHours,
        maxHours: MAX_WEEKLY_HOURS
      });
    }

    booking.mechanic = mechanicId;
    // Only change status to 'confirmed' if currently 'pending'
    // Don't override 'approved' or other statuses
    if (booking.status === 'pending') {
      booking.status = 'confirmed';
    }
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('mechanic', 'name email')
      .populate('service');

    res.json({
      message: 'Mecânico atribuído',
      booking: updatedBooking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// BUDGET APPROVAL WORKFLOW ENDPOINTS
// ============================================

// Set final price (mechanic) - moves to AWAITING_APPROVAL
exports.setPrice = async (req, res) => {
  try {
    const { finalPrice, mechanicNotes } = req.body;

    if (!finalPrice || finalPrice <= 0) {
      return res.status(400).json({ message: 'Preço final é obrigatório e deve ser maior que zero' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Only mechanic assigned or admin can set price
    const bookingWorkshopId = getWorkshopId(booking.workshop);
    const userWorkshopId = getWorkshopId(req.user.workshop);
    const isAuthorized =
      (req.user.role === 'mechanic' && booking.mechanic?.toString() === req.user.id) ||
      (req.user.role === 'admin' && bookingWorkshopId === userWorkshopId);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Can only set price for pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        message: `Não é possível definir preço para marcação com estado "${booking.status}"`
      });
    }

    // Update booking
    booking.finalPrice = finalPrice;
    if (mechanicNotes) booking.mechanicNotes = mechanicNotes;
    booking.status = 'awaiting_approval';

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email')
      .populate('service')
      .populate('vehicle');

    res.json({
      message: 'Preço definido. Aguardando aprovação do cliente.',
      booking: populatedBooking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve price (customer) - moves to APPROVED
exports.approvePrice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Only customer who owns the booking can approve
    if (req.user.role !== 'customer' || booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Can only approve if status is awaiting_approval
    if (booking.status !== 'awaiting_approval') {
      return res.status(400).json({
        message: `Não é possível aprovar marcação com estado "${booking.status}". Estado esperado: awaiting_approval`
      });
    }

    // Update booking
    booking.status = 'approved';
    booking.approvedAt = new Date();

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('service')
      .populate('vehicle')
      .populate('workshop', 'name');

    res.json({
      message: 'Orçamento aprovado. O serviço pode ser iniciado.',
      booking: populatedBooking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start service (mechanic) - moves to IN_PROGRESS
exports.startService = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Only mechanic assigned or admin can start service
    const bookingWorkshopId = getWorkshopId(booking.workshop);
    const userWorkshopId = getWorkshopId(req.user.workshop);
    const isAuthorized =
      (req.user.role === 'mechanic' && booking.mechanic?.toString() === req.user.id) ||
      (req.user.role === 'admin' && bookingWorkshopId === userWorkshopId);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Must have mechanic assigned
    if (!booking.mechanic) {
      return res.status(400).json({ message: 'Marcação deve ter um mecânico atribuído' });
    }

    // Can only start if approved or confirmed (legacy flow)
    if (!['approved', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        message: `Não é possível iniciar serviço com estado "${booking.status}". Estado esperado: approved ou confirmed`
      });
    }

    booking.status = 'in_progress';
    booking.startedAt = new Date();

    await booking.save();

    res.json({
      message: 'Serviço iniciado',
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete service (mechanic) - moves to COMPLETED
exports.completeService = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Only mechanic assigned or admin can complete
    const bookingWorkshopId = getWorkshopId(booking.workshop);
    const userWorkshopId = getWorkshopId(req.user.workshop);
    const isAuthorized =
      (req.user.role === 'mechanic' && booking.mechanic?.toString() === req.user.id) ||
      (req.user.role === 'admin' && bookingWorkshopId === userWorkshopId);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Can only complete if in_progress
    if (booking.status !== 'in_progress') {
      return res.status(400).json({
        message: `Não é possível concluir serviço com estado "${booking.status}". Estado esperado: in_progress`
      });
    }

    booking.status = 'completed';
    booking.completedAt = new Date();

    await booking.save();

    res.json({
      message: 'Serviço concluído',
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate invoice (only for completed bookings)
exports.getInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email nif phone')
      .populate('service')
      .populate('vehicle')
      .populate('workshop');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Check permissions - customer or admin can view invoice
    const bookingWorkshopId = getWorkshopId(booking.workshop);
    const userWorkshopId = getWorkshopId(req.user.workshop);
    const canView =
      (req.user.role === 'customer' && booking.customer._id.toString() === req.user.id) ||
      (req.user.role === 'admin' && bookingWorkshopId === userWorkshopId) ||
      (req.user.role === 'mechanic' && booking.mechanic?.toString() === req.user.id);

    if (!canView) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Can only generate invoice for completed bookings
    if (booking.status !== 'completed') {
      return res.status(400).json({
        message: 'Fatura só pode ser gerada para marcações concluídas'
      });
    }

    // Calculate invoice values
    const basePrice = booking.finalPrice || booking.estimatedPrice || booking.service.price;
    const vatRate = 0.23;  // 23% VAT in Portugal
    const vatAmount = basePrice * vatRate;
    const totalAmount = basePrice + vatAmount;

    const invoice = {
      invoiceNumber: `INV-${booking._id.toString().slice(-8).toUpperCase()}`,
      invoiceDate: booking.completedAt || booking.updatedAt,

      workshop: {
        name: booking.workshop.name,
        nif: booking.workshop.nif,
        address: booking.workshop.address,
        city: booking.workshop.city,
        postalCode: booking.workshop.postalCode,
        contact: booking.workshop.contact
      },

      customer: {
        name: booking.customer.name,
        email: booking.customer.email,
        nif: booking.customerNif || booking.customer.nif || 'N/A',
        phone: booking.customer.phone
      },

      vehicle: {
        licensePlate: booking.vehicle.licensePlate,
        brand: booking.vehicle.brand,
        model: booking.vehicle.model,
        year: booking.vehicle.year
      },

      service: {
        name: booking.service.name,
        description: booking.service.publicDescription,
        date: booking.startTime,
        duration: booking.service.durationMinutes
      },

      pricing: {
        estimatedPrice: booking.estimatedPrice,
        finalPrice: booking.finalPrice,
        basePrice: basePrice,
        vatRate: vatRate * 100,  // 23%
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100
      },

      bookingId: booking._id,
      completedAt: booking.completedAt,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod
    };

    res.json(invoice);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
