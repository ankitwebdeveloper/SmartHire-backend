const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    // allowUnknown:false is intentional — reject any extra/unexpected keys from clientside payloads
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: false, stripUnknown: true });
    
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ success: false, message: errorMessage });
    }
    
    next();
  };
};

const schemas = {
  jobCreation: Joi.object({
    // Frontend contract (Employer Dashboard)
    title: Joi.string().required().min(3).max(100).trim(),
    company: Joi.string().required().min(2).max(120).trim(),
    location: Joi.string().required().min(2).max(120).trim(),
    salary: Joi.string().allow('').max(60),
    jobType: Joi.string().valid('full-time', 'part-time', 'internship', 'contract', 'remote').required(),
    experience: Joi.string().allow('').max(60),
    description: Joi.string().required().min(20).max(5000),
  }),

  jobUpdate: Joi.object({
    title: Joi.string().min(3).max(100).trim(),
    company: Joi.string().min(2).max(120).trim(),
    location: Joi.string().min(2).max(120).trim(),
    salary: Joi.string().allow('').max(60),
    jobType: Joi.string().valid('full-time', 'part-time', 'internship', 'contract', 'remote'),
    experience: Joi.string().allow('').max(60),
    description: Joi.string().min(20).max(5000),
  }).min(1),
  
  applicationStatus: Joi.object({
    status: Joi.string().valid('applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected').required(),
  }),

  // Admin direct publish job creation (no employer subscription/payment)
  adminJobCreation: Joi.object({
    jobTitle: Joi.string().required().min(3).max(100).trim(),
    companyName: Joi.string().required().min(2).max(120).trim(),
    location: Joi.string().required().min(2).max(120).trim(),
    salary: Joi.string().required().min(1).max(60).trim(),
    jobType: Joi.string().valid('full-time', 'part-time', 'internship', 'contract', 'remote').required(),
    category: Joi.string().valid('IT', 'Marketing', 'Finance', 'Design', 'Engineering', 'Other').required(),
    jobDescription: Joi.string().required().min(20).max(5000).trim(),
    skillsRequired: Joi.string().required().min(1).max(2000).trim(),

    // Candidate requirements
    experienceRequired: Joi.string()
      .valid('fresher', '1-3 years', '3-5 years', '5+ years')
      .required(),
    education: Joi.string().required().min(2).max(2000).trim(),
    openings: Joi.number().integer().min(1).required(),
    gender: Joi.string().allow('', null).optional(),
    ageLimit: Joi.string().allow('', null).optional(),
  }),

  userRegistration: Joi.object({
    name: Joi.string().required().min(2).max(80).trim(),
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required().min(8).max(128),
    // Admin accounts CANNOT be created via public registration. Only jobseeker/employer allowed.
    role: Joi.string().valid('jobseeker', 'employer').default('jobseeker'),
  })
};

module.exports = { validateRequest, schemas };
