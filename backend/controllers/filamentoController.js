import Filamento from '../models/Filamento.js';

export const getFilamentos = async (req, res) => {
  try {
    const filamentos = await Filamento.find();
    res.json(filamentos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createFilamento = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.estoque_gramas === undefined) {
      data.estoque_gramas = data.peso_total_g;
    }
    const filamento = new Filamento(data);
    const saved = await filamento.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateFilamento = async (req, res) => {
  try {
    const filamento = await Filamento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(filamento);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteFilamento = async (req, res) => {
  try {
    await Filamento.findByIdAndDelete(req.params.id);
    res.json({ message: 'Filamento removido' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
