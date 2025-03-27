const validateJobListing = (jobData) => {
  const errors = [];
  
  if (!jobData.title) {
    errors.push('Заглавието е задължително');
  }
  
  if (!jobData.description) {
    errors.push('Описанието е задължително');
  }
  
  if (!jobData.location) {
    errors.push('Локацията е задължителна');
  }
  
  if (!jobData.job_type) {
    errors.push('Типът работа е задължителен');
  } else if (!['full-time', 'part-time', 'contract', 'internship', 'remote'].includes(jobData.job_type)) {
    errors.push('Невалиден тип работа');
  }
  
  if (jobData.application_deadline) {
    const deadline = new Date(jobData.application_deadline);
    const now = new Date();
    
    if (deadline < now) {
      errors.push('Крайният срок не може да бъде в миналото');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = validateJobListing; 