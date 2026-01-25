/**
 * CONTROLADOR DE AGENDAMENTOS (Booking Controller)
 * * Gere toda a lógica de marcações, disponibilidade de horários,
 * atribuição de mecânicos e validação de regras de negócio.
 * * @module controllers/bookingController
 */

const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');
const Workshop = require('../models/Workshop');
const User = require('../models/User');

// --- CONSTANTES E REGRAS DE NEGÓCIO ---
/** Limite máximo de horas de trabalho por semana para um mecânico */
const MAX_WEEKLY_HOURS = 40;
/** Antecedência mínima (em horas) para realizar uma marcação */
const MIN_HOURS_NOTICE = 48; 

// --- FUNÇÕES AUXILIARES (HELPERS) ---

/**
 * Calcula o início (Segunda 00:00) e fim (Domingo 23:59) da semana atual.
 * Usado para verificar o limite de 40h semanais.
 * @param {Date} date - Data de referência
 */
const getWeekBounds = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  // Ajusta para Segunda-feira ser o dia 1 (Se for Domingo/0, volta 6 dias)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 

  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return { weekStart, weekEnd };
};

/**
 * Calcula quantas horas um mecânico já tem ocupadas numa semana específica.
 * @returns {Promise<number>} Total de horas ocupadas.
 */
const getMechanicWeeklyHours = async (mechanicId, weekStart, weekEnd) => {
  const bookings = await Booking.find({
    mechanic: mechanicId,
    status: { $nin: ['cancelled'] }, // Ignora cancelados
    startTime: { $gte: weekStart, $lt: weekEnd }
  }).populate('service');

  const totalMinutes = bookings.reduce((sum, booking) => {
    return sum + (booking.service?.durationMinutes || 0);
  }, 0);

  return totalMinutes / 60; // Converte minutos para horas
};

/**
 * Verifica se uma data cai no Sábado (6) ou Domingo (0).
 */
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

/**
 * Valida se a marcação respeita as 48h de antecedência mínima.
 */
const meetsMinimumNotice = (startTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const hoursUntilBooking = (start - now) / (1000 * 60 * 60);
  return hoursUntilBooking >= MIN_HOURS_NOTICE;
};

/**
 * Processo automático: Busca agendamentos antigos que ficaram como 'confirmed'
 * ou 'in_progress' e marca-os como 'completed'.
 * Isso mantém o histórico limpo sem ação manual.
 */
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

// --- CONTROLADORES EXPORTADOS ---

/**
 * VERIFICAR DISPONIBILIDADE
 * * Algoritmo complexo que calcula slots de 30min livres num dia específico.
 * * 1. Verifica se é fim de semana.
 * * 2. Verifica regra de 48h.
 * * 3. Cruza o horário de funcionamento da oficina com agendamentos existentes.
 * * 4. Retorna lista de horários (slots) onde ainda há vagas.
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { workshopId, date, serviceIds } = req.body;

    // Validações básicas
    if (!workshopId || !date || !serviceIds || serviceIds.length === 0) {
      return res.status(400).json({
        message: 'Workshop, data e serviços são obrigatórios'
      });
    }

    // Regra: Fim de semana bloqueado
    if (isWeekend(date)) {
      return res.status(400).json({
        message: 'Não aceitamos marcações nos fins de semana (Sábado e Domingo)',
        isWeekend: true
      });
    }

    // Regra: Antecedência mínima (48h)
    const requestedDate = new Date(date);
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + MIN_HOURS_NOTICE);

    if (requestedDate < minDate.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        message: `Marcações requerem um mínimo de ${MIN_HOURS_NOTICE} horas de antecedência`,
        minNoticeHours: MIN_HOURS_NOTICE
      });
    }

    // Buscar dados da oficina (horário de abertura/fecho)
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'Oficina não encontrada' });
    }

    // Calcular duração total dos serviços selecionados
    const services = await Service.find({ _id: { $in: serviceIds } });
    if (services.length === 0) {
      return res.status(404).json({ message: 'Serviços não encontrados' });
    }

    const totalDuration = services.reduce((sum, service) => sum + service.durationMinutes, 0);

    // Definir intervalo do dia (00:00 às 23:59)
    requestedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(requestedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Buscar agendamentos que já ocupam este dia
    const existingBookings = await Booking.find({
      workshop: workshopId,
      startTime: {
        $gte: requestedDate,
        $lt: nextDay
      },
      status: { $nin: ['cancelled', 'completed'] }
    });

    // Parse do horário de funcionamento (ex: "09:00" -> 9, 0)
    const [startHour, startMinute] = workshop.openingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workshop.openingHours.end.split(':').map(Number);

    // --- ALGORITMO DE GERAÇÃO DE SLOTS ---
    const availableSlots = [];
    let currentTime = startHour * 60 + startMinute; // Converter tudo para minutos
    const closeTime = endHour * 60 + endMinute;

    // Loop a cada 30 minutos
    while (currentTime + totalDuration <= closeTime) {
      const slotHour = Math.floor(currentTime / 60);
      const slotMinute = currentTime % 60;
      const timeString = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;

      // Criar datas para inicio e fim do slot proposto
      const slotStart = new Date(requestedDate);
      slotStart.setHours(slotHour, slotMinute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + totalDuration);

      // Verificar colisões com agendamentos existentes
      const conflictingBookings = existingBookings.filter(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        // Lógica de sobreposição de horários
        return (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        );
      });

      // Calcular vagas restantes (Max por hora - Conflitos)
      const spotsLeft = workshop.maxSlotsPerHour - conflictingBookings.length;

      // Se houver vaga, adiciona à lista
      if (spotsLeft > 0) {
        availableSlots.push({
          time: timeString,
          available: true,
          spotsLeft
        });
      }

      currentTime += 30; // Avança para o próximo slot de 30min
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

/**
 * CRIAR AGENDAMENTO (Cliente)
 * * Valida veículo, serviço, regras de data (passado, fim de semana, 48h)
 * e conflitos de mecânico (se atribuído).
 */
exports.createBooking = async (req, res) => {
  try {
    const { workshopId, vehicleId, serviceId, startTime, mechanicId } = req.body;

    // Validar propriedade do veículo
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Veículo inválido' });
    }

    // Validar Serviço
    const service = await Service.findById(serviceId);
    if (!service || service.workshop.toString() !== workshopId) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    // Calcular hora de término
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    // Validações de Tempo
    if (start < new Date()) {
      return res.status(400).json({ message: 'Não pode marcar no passado' });
    }

    if (isWeekend(start)) {
      return res.status(400).json({
        message: 'Não aceitamos marcações nos fins de semana (Sábado e Domingo)'
      });
    }

    if (!meetsMinimumNotice(start)) {
      return res.status(400).json({
        message: `Marcações requerem um mínimo de ${MIN_HOURS_NOTICE} horas de antecedência`
      });
    }

    // Verificar disponibilidade do Mecânico (caso seja pré-selecionado)
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

    // Criar Registo
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

    // Retornar objeto populado
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

/**
 * LISTAR AGENDAMENTOS
 * * Filtra agendamentos baseados no papel do utilizador (Role):
 * - Cliente: Vê apenas os seus.
 * - Mecânico: Vê os seus e recebe dashboard categorizado (Ativos/Futuros).
 * - Admin: Vê todos da oficina e aciona limpeza automática de antigos.
 */
exports.getBookings = async (req, res) => {
  try {
    let query = {};

    // Filtro Cliente
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }

    // Filtro Mecânico
    if (req.user.role === 'mechanic') {
      query.mechanic = req.user.id;
    }

    // Filtro Admin
    if (req.user.role === 'admin') {
      query.workshop = req.user.workshop;
      // Admin a ver a lista aciona a limpeza de agendamentos expirados
      await autoCompleteExpiredBookings(req.user.workshop);
    }

    // Mecânico também limpa os seus agendamentos expirados
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

    // Busca principal
    const bookings = await Booking.find(query)
      .populate('customer', 'name email')
      .populate('mechanic', 'name email')
      .populate('vehicle')
      .populate('service')
      .populate('workshop')
      .sort({ startTime: -1 });

    // DASHBOARD DO MECÂNICO (Resposta diferenciada)
    if (req.user.role === 'mechanic') {
      const now = new Date();
      
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

    // Resposta padrão (Admin/Cliente)
    res.json(bookings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DISPONIBILIDADE DOS MECÂNICOS (Admin Only)
 * * Calcula a carga horária semanal de cada mecânico para ajudar o Admin na atribuição.
 * * Verifica limite de 40h semanais.
 */
exports.getMechanicsAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    const { bookingDate } = req.query;
    const targetDate = bookingDate ? new Date(bookingDate) : new Date();
    const { weekStart, weekEnd } = getWeekBounds(targetDate);

    // Buscar todos os mecânicos da oficina
    const mechanics = await User.find({
      workshop: req.user.workshop,
      role: 'mechanic'
    }).select('name email');

    // Calcular carga horária de cada um
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

/**
 * OBTER UM AGENDAMENTO
 * * Retorna detalhes de uma marcação específica.
 * * Inclui verificação de permissão (apenas dono, mecânico atribuído ou admin).
 */
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

    // Verificação de Segurança (Permissões)
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

/**
 * ATUALIZAR STATUS (Mecânico/Admin)
 * * Permite mudar status (ex: pending -> in_progress -> completed)
 * * Permite adicionar notas técnicas.
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Apenas Admin da oficina ou Mecânico atribuído podem alterar
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

/**
 * CANCELAR AGENDAMENTO
 * * Permite ao Cliente ou Admin cancelar, desde que o serviço
 * ainda não tenha sido concluído.
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Verificação de permissões
    const canCancel = 
      req.user.role === 'customer' && booking.customer.toString() === req.user.id ||
      req.user.role === 'admin' && booking.workshop.toString() === req.user.workshop;

    if (!canCancel) {
      return res.status(403).json({ message: 'Sem permissão para cancelar' });
    }

    // Bloqueio de regra lógica
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

/**
 * OBTER CONCLUÍDOS RECENTEMENTE (Polling do Cliente)
 * * Endpoint para o App verificar se o carro ficou pronto nas últimas 24h.
 * * Útil para notificações ou atualizações de UI em tempo real.
 */
exports.getRecentlyCompletedBookings = async (req, res) => {
  try {
    // Apenas clientes
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Apenas clientes podem aceder a este endpoint' });
    }

    const { since } = req.query;
    // Padrão: últimas 24h
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); 

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

/**
 * ATRIBUIR MECÂNICO (Gestão de RH)
 * * Função crítica para o Admin.
 * * Verifica se o mecânico tem conflito de horário.
 * * Verifica se a atribuição violaria o limite de 40h semanais (MAX_WEEKLY_HOURS).
 */
exports.assignMechanic = async (req, res) => {
  try {
    const { mechanicId } = req.body;

    const booking = await Booking.findById(req.params.id).populate('service');

    if (!booking) {
      return res.status(404).json({ message: 'Marcação não encontrada' });
    }

    // Verificar se é admin da oficina correta
    if (req.user.role !== 'admin' || booking.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Verificação 1: Conflito de agenda (Sobreposição de horários)
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

    // Verificação 2: Limite de 40 horas semanais
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

    // Sucesso: Atribui e confirma
    booking.mechanic = mechanicId;
    booking.status = 'confirmed';
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

module.exports = exports;