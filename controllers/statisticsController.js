const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const Review = require('../models/Review');

// Helper: Get workshop ID as ObjectId (handles both ObjectId, string, and populated object)
const getWorkshopId = (workshop) => {
  if (!workshop) return null;
  let id;
  if (typeof workshop === 'object' && workshop._id) {
    id = workshop._id;
  } else {
    id = workshop;
  }
  // Convert to ObjectId if it's a valid string
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// Get workshop dashboard statistics (admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    const workshopId = getWorkshopId(req.user.workshop);

    if (!workshopId) {
      return res.status(400).json({ message: 'Admin não está associado a uma oficina' });
    }

    // Get current date boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Week boundaries (Monday to Sunday)
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Booking counts by status
    const [
      todayBookings,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      weekBookings,
      monthBookings
    ] = await Promise.all([
      // Today's bookings
      Booking.countDocuments({
        workshop: workshopId,
        startTime: { $gte: todayStart, $lt: todayEnd }
      }),
      // Pending
      Booking.countDocuments({
        workshop: workshopId,
        status: 'pending'
      }),
      // Confirmed
      Booking.countDocuments({
        workshop: workshopId,
        status: 'confirmed'
      }),
      // In Progress
      Booking.countDocuments({
        workshop: workshopId,
        status: 'in_progress'
      }),
      // Completed (all time)
      Booking.countDocuments({
        workshop: workshopId,
        status: 'completed'
      }),
      // Cancelled
      Booking.countDocuments({
        workshop: workshopId,
        status: 'cancelled'
      }),
      // This week bookings
      Booking.countDocuments({
        workshop: workshopId,
        startTime: { $gte: weekStart, $lt: weekEnd }
      }),
      // This month bookings
      Booking.countDocuments({
        workshop: workshopId,
        startTime: { $gte: monthStart, $lt: monthEnd }
      })
    ]);

    // Revenue calculations (sum of service prices for completed bookings)
    const revenueAggregation = await Booking.aggregate([
      {
        $match: {
          workshop: workshopId,
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceData'
        }
      },
      {
        $unwind: '$serviceData'
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$serviceData.price' }
        }
      }
    ]);

    const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

    // Monthly revenue
    const monthlyRevenueAggregation = await Booking.aggregate([
      {
        $match: {
          workshop: workshopId,
          status: 'completed',
          startTime: { $gte: monthStart, $lt: monthEnd }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceData'
        }
      },
      {
        $unwind: '$serviceData'
      },
      {
        $group: {
          _id: null,
          monthlyRevenue: { $sum: '$serviceData.price' }
        }
      }
    ]);

    const monthlyRevenue = monthlyRevenueAggregation[0]?.monthlyRevenue || 0;

    // Staff count (mechanics in this workshop)
    const mechanicsCount = await User.countDocuments({
      workshop: workshopId,
      role: 'mechanic'
    });

    // Services count
    const servicesCount = await Service.countDocuments({
      workshop: workshopId
    });

    // Average rating from reviews
    const reviewStats = await Review.aggregate([
      {
        $match: {
          workshop: workshopId,
          visible: true
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = reviewStats[0]?.averageRating?.toFixed(1) || 0;
    const totalReviews = reviewStats[0]?.totalReviews || 0;

    // Recent bookings (last 5)
    const recentBookings = await Booking.find({ workshop: workshopId })
      .populate('customer', 'name email')
      .populate('mechanic', 'name')
      .populate('service', 'name price')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ createdAt: -1 })
      .limit(5);

    // Today's schedule
    const todaySchedule = await Booking.find({
      workshop: workshopId,
      startTime: { $gte: todayStart, $lt: todayEnd }
    })
      .populate('customer', 'name')
      .populate('mechanic', 'name')
      .populate('service', 'name durationMinutes')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ startTime: 1 });

    res.json({
      bookings: {
        today: todayBookings,
        thisWeek: weekBookings,
        thisMonth: monthBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        inProgress: inProgressBookings,
        completed: completedBookings,
        cancelled: cancelledBookings
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue
      },
      staff: {
        mechanics: mechanicsCount
      },
      services: {
        total: servicesCount
      },
      reviews: {
        average: parseFloat(averageRating),
        total: totalReviews
      },
      recentBookings,
      todaySchedule
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get mechanics list for admin workshop
exports.getMechanics = async (req, res) => {
  try {
    const workshopId = getWorkshopId(req.user.workshop);

    if (!workshopId) {
      return res.status(400).json({ message: 'Admin não está associado a uma oficina' });
    }

    const mechanics = await User.find({
      workshop: workshopId,
      role: 'mechanic'
    }).select('name email phone createdAt');

    res.json(mechanics);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete mechanic (admin only)
exports.deleteMechanic = async (req, res) => {
  try {
    const workshopId = getWorkshopId(req.user.workshop);
    const mechanicId = req.params.id;

    // Find mechanic
    const mechanic = await User.findById(mechanicId);

    if (!mechanic) {
      return res.status(404).json({ message: 'Mecânico não encontrado' });
    }

    // Check if mechanic belongs to admin's workshop
    if (mechanic.workshop.toString() !== workshopId.toString()) {
      return res.status(403).json({ message: 'Sem permissão para remover este mecânico' });
    }

    // Check if mechanic has active bookings
    const activeBookings = await Booking.countDocuments({
      mechanic: mechanicId,
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        message: `Mecânico tem ${activeBookings} marcações ativas. Reatribua ou cancele antes de remover.`
      });
    }

    await User.findByIdAndDelete(mechanicId);

    res.json({ message: 'Mecânico removido com sucesso' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
