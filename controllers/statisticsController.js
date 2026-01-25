/**
 * CONTROLADOR DO ADMIN (Dashboard & Gestão)
 * * Agrega estatísticas vitais para o painel de gestão (KPIs).
 * * Gere a equipa de mecânicos da oficina.
 * * @module controllers/adminController
 */

const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const Review = require('../models/Review');

/**
 * ESTATÍSTICAS DO DASHBOARD
 * * Este é o "cérebro" do painel do Admin.
 * * Realiza múltiplas consultas paralelas para obter:
 * * 1. Volume de marcações (Hoje, Semana, Mês, Totais por estado).
 * * 2. Receita Financeira (Cruzando dados de Booking com Service para somar preços).
 * * 3. Performance da equipa (Média de avaliações).
 * * 4. Agenda operacional do dia atual.
 * * @param req - Requer utilizador Admin com oficina associada
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const workshopId = req.user.workshop;

    if (!workshopId) {
      return res.status(400).json({ message: 'Admin não está associado a uma oficina' });
    }

    // --- CÁLCULO DE DATAS ---
    // Definir o início e fim do dia de hoje
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Definir limites da Semana (Segunda a Domingo)
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Definir limites do Mês atual
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // --- CONSULTAS PARALELAS (Performance) ---
    // Promise.all executa todas as contagens ao mesmo tempo para ser mais rápido
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
      // Marcações de Hoje
      Booking.countDocuments({
        workshop: workshopId,
        startTime: { $gte: todayStart, $lt: todayEnd }
      }),
      // Pendentes
      Booking.countDocuments({
        workshop: workshopId,
        status: 'pending'
      }),
      // Confirmadas
      Booking.countDocuments({
        workshop: workshopId,
        status: 'confirmed'
      }),
      // Em Progresso
      Booking.countDocuments({
        workshop: workshopId,
        status: 'in_progress'
      }),
      // Concluídas (Total Histórico)
      Booking.countDocuments({
        workshop: workshopId,
        status: 'completed'
      }),
      // Canceladas
      Booking.countDocuments({
        workshop: workshopId,
        status: 'cancelled'
      }),
      // Volume Semanal
      Booking.countDocuments({
        workshop: workshopId,
        startTime: { $gte: weekStart, $lt: weekEnd }
      }),
      // Volume Mensal
      Booking.countDocuments({
        workshop: workshopId,
        startTime: { $gte: monthStart, $lt: monthEnd }
      })
    ]);

    // --- CÁLCULO DE RECEITA (Aggregation Pipeline) ---
    // O MongoDB soma o preço dos serviços das marcações 'completed'.
    // É necessário fazer 'lookup' (join) porque o preço está na coleção Services.
    
    

    const revenueAggregation = await Booking.aggregate([
      {
        $match: {
          workshop: workshopId,
          status: 'completed' // Apenas conta dinheiro de serviços acabados
        }
      },
      {
        $lookup: { // Join com a tabela de serviços
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceData'
        }
      },
      {
        $unwind: '$serviceData' // Aplaina o array resultante do join
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$serviceData.price' } // Soma final
        }
      }
    ]);

    const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

    // Receita Mensal (Mesma lógica, filtro de data diferente)
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

    // Contagem de Staff (Mecânicos)
    const mechanicsCount = await User.countDocuments({
      workshop: workshopId,
      role: 'mechanic'
    });

    // Contagem de Serviços no Menu
    const servicesCount = await Service.countDocuments({
      workshop: workshopId
    });

    // Média de Avaliações (Rating)
    const reviewStats = await Review.aggregate([
      {
        $match: {
          workshop: workshopId,
          isVisible: true
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

    // Últimas 5 marcações (para tabela de "Atividade Recente")
    const recentBookings = await Booking.find({ workshop: workshopId })
      .populate('customer', 'name email')
      .populate('mechanic', 'name')
      .populate('service', 'name price')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ createdAt: -1 })
      .limit(5);

    // Agenda do Dia (Ordenada por hora)
    const todaySchedule = await Booking.find({
      workshop: workshopId,
      startTime: { $gte: todayStart, $lt: todayEnd }
    })
      .populate('customer', 'name')
      .populate('mechanic', 'name')
      .populate('service', 'name durationMinutes')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ startTime: 1 });

    // Construção do Objeto de Resposta Final
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

/**
 * LISTAR MECÂNICOS
 * * Retorna lista simples dos funcionários da oficina para gestão de RH.
 */
exports.getMechanics = async (req, res) => {
  try {
    const workshopId = req.user.workshop;

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

/**
 * REMOVER MECÂNICO
 * * Apaga um funcionário do sistema.
 * * REGRA DE INTEGRIDADE: Impede a remoção se o mecânico tiver
 * * marcações ativas (pendentes, confirmadas ou em progresso) para evitar
 * * deixar clientes sem atendimento ("Marcações órfãs").
 */
exports.deleteMechanic = async (req, res) => {
  try {
    const workshopId = req.user.workshop;
    const mechanicId = req.params.id;

    // Validar existência
    const mechanic = await User.findById(mechanicId);

    if (!mechanic) {
      return res.status(404).json({ message: 'Mecânico não encontrado' });
    }

    // Validar permissão (Dono da oficina)
    if (mechanic.workshop.toString() !== workshopId.toString()) {
      return res.status(403).json({ message: 'Sem permissão para remover este mecânico' });
    }

    // Validar se está livre de serviços
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