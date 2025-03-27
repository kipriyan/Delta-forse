const Joi = require('joi');

const companyValidations = {
  createCompany: Joi.object({
    companyName: Joi.string().required().min(2).max(100),
    description: Joi.string().required().min(20),
    industry: Joi.string().required(),
    companySize: Joi.string().required(),
    website: Joi.string().uri()
  }),

  updateCompany: Joi.object({
    companyName: Joi.string().min(2).max(100),
    description: Joi.string().min(20),
    industry: Joi.string(),
    companySize: Joi.string(),
    website: Joi.string().uri()
  })
};

module.exports = companyValidations; 