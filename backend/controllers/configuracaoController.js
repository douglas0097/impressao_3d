import Configuracao from '../models/Configuracao.js';

export const getConfiguracao = async (req, res) => {
  try {
    let config = await Configuracao.findOne();
    if (!config) {
      config = await Configuracao.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateConfiguracao = async (req, res) => {
  try {
    let config = await Configuracao.findOne();
    if (!config) {
      config = new Configuracao(req.body);
      await config.save();
    } else {
      config = await Configuracao.findByIdAndUpdate(config._id, req.body, { new: true });
    }
    res.json(config);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
