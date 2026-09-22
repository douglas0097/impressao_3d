import Cliente from '../models/Cliente.js';

export const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCliente = async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    const saved = await cliente.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cliente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cliente removido' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
