/**
 * CONTROLADOR DE TURNOS (Shift Schedule)
 * * Gere os horários de trabalho dos mecânicos.
 * * Permite ao Admin definir quando cada mecânico está disponível para receber marcações.
 * * @module controllers/shiftController
 */

const Shift = require('../models/Shift');
const User = require('../models/User');

/**
 * CRIAR TURNO
 * * Define um dia de trabalho para um mecânico específico.
 * * Validações de Integridade:
 * * 1. Apenas Admin pode criar.
 * * 2. O mecânico tem de pertencer à oficina do Admin.
 * * 3. Não permite duplicidade (dois turnos para o mesmo mecânico no mesmo dia).
 * * @param req - Body com mechanicId, date, startTime, endTime, maxBookings
 * @param res - Retorna o turno criado com dados populados
 */
exports.createShift = async (req, res) => {
  try {
    const { mechanicId, date, startTime, endTime, maxBookings } = req.body;

    // Verificar se é admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Apenas admins podem criar turnos' });
    }

    // Verificar se o mecânico pertence a esta oficina
    const mechanic = await User.findById(mechanicId);
    if (!mechanic || mechanic.workshop.toString() !== req.user.workshop) {
      return res.status(400).json({ message: 'Mecânico inválido ou não pertence à sua oficina' });
    }

    // Evitar sobreposição de turnos no mesmo dia
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

/**
 * LISTAR TURNOS DA OFICINA
 * * Útil para a vista de calendário do Admin ("Quem está a trabalhar esta semana?").
 * * Suporta filtragem por intervalo de datas (startDate, endDate).
 */
exports.getShiftsByWorkshop = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { workshop: req.params.workshopId };

    // Filtro de data (se fornecido na URL)
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

/**
 * LISTAR TURNOS DO MECÂNICO
 * * Permite ao mecânico ver a sua própria escala de trabalho.
 */
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

/**
 * OBTER UM TURNO
 * * Detalhes de um turno específico.
 */
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

/**
 * ATUALIZAR TURNO
 * * Permite alterar horário ou capacidade máxima de atendimentos.
 * * Apenas o Admin da oficina pode fazer alterações.
 */
exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ message: 'Turno não encontrado' });
    }

    // Verificação de segurança (Dono da Oficina)
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

/**
 * APAGAR TURNO
 * * Remove o turno da escala.
 * * Apenas Admin da oficina.
 */
exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ message: 'Turno não encontrado' });
    }

    // Verificação de permissão
    if (req.user.role !== 'admin' || shift.workshop.toString() !== req.user.workshop) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    await shift.deleteOne();

    res.json({ message: 'Turno apagado com sucesso' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};