const Joi = require('joi');

const equipmentValidations = {
  createEquipment: Joi.object({
    title: Joi.string().required().min(5).max(100),
    description: Joi.string().required().min(20),
    price: Joi.number().required().min(0),
    location: Joi.string().required(),
    category: Joi.string().required(),
    specifications: Joi.object().pattern(
      Joi.string(),
      Joi.string()
    ),
    contact: Joi.string()
  }),

  updateEquipment: Joi.object({
    title: Joi.string().min(5).max(100),
    description: Joi.string().min(20),
    price: Joi.number().min(0),
    location: Joi.string(),
    category: Joi.string(),
    specifications: Joi.object().pattern(
      Joi.string(),
      Joi.string()
    ),
    contact: Joi.string()
  }),

  createRentalRequest: Joi.object({
    startDate: Joi.date().required().min('now'),
    endDate: Joi.date().required().min(Joi.ref('startDate')),
    message: Joi.string().required().min(20),
  }),

  updateRequestStatus: Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected').required()
  })
};

module.exports = equipmentValidations; 