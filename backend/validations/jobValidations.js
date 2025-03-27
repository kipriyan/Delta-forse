const Joi = require('joi');

const jobValidations = {
  createJob: Joi.object({
    title: Joi.string().required().min(5).max(100),
    description: Joi.string().required().min(20),
    requirements: Joi.string().required(),
    benefits: Joi.string(),
    location: Joi.string().required(),
    salary: Joi.string().required(),
    jobType: Joi.string().valid('full-time', 'part-time', 'contract', 'temporary').required(),
    category: Joi.string().required(),
    industry: Joi.string().required()
  }),

  updateJob: Joi.object({
    title: Joi.string().min(5).max(100),
    description: Joi.string().min(20),
    requirements: Joi.string(),
    benefits: Joi.string(),
    location: Joi.string(),
    salary: Joi.string(),
    jobType: Joi.string().valid('full-time', 'part-time', 'contract', 'temporary'),
    category: Joi.string(),
    industry: Joi.string()
  }),

  applyForJob: Joi.object({
    coverLetter: Joi.string().required().min(50),
    cvUrl: Joi.string().required().uri()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'approved', 'rejected').required()
  })
};

module.exports = jobValidations; 