// Добавяне на специфичен маршрут за качване на CV файлове

// @desc    Качване на CV файл
// @route   POST /api/upload/resume
// @access  Private
router.post('/resume', protect, (req, res, next) => {
  // Настройка за качване на CV файлове
  const resumeUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const dirPath = path.join(__dirname, '..', 'public', 'uploads', 'resumes');
        // Създаване на директорията, ако не съществува
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        cb(null, dirPath);
      },
      filename: (req, file, cb) => {
        // Генериране на уникално име с потребителски ID
        const userId = req.user.id;
        const uniqueName = `user_${userId}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    }),
    fileFilter: (req, file, cb) => {
      // Проверка на типа на файла
      const allowedTypes = /pdf|doc|docx/;
      const ext = path.extname(file.originalname).toLowerCase().substring(1);
      
      if (!allowedTypes.test(ext)) {
        return cb(new ErrorResponse('Разрешени са само PDF, DOC и DOCX файлове', 400), false);
      }
      
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  }).single('resume');

  // Използване на middleware за качване на CV
  resumeUpload(req, res, (err) => {
    if (err) {
      if (err instanceof ErrorResponse) {
        return next(err);
      }
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ErrorResponse('Размерът на файла не може да надвишава 5MB', 400));
      }
      
      return next(new ErrorResponse('Възникна проблем при качването на файла', 400));
    }
    
    if (!req.file) {
      return next(new ErrorResponse('Моля, изберете файл за качване', 400));
    }
    
    // Конфигуриране на пътя до файла
    const relativeFilePath = path.join('uploads', 'resumes', req.file.filename);
    const absoluteFilePath = path.join('public', relativeFilePath);
    const fileUrl = `${req.protocol}://${req.get('host')}/${relativeFilePath.replace(/\\/g, '/')}`;
    
    res.status(200).json({
      success: true,
      data: {
        fileName: req.file.filename,
        fileType: req.file.mimetype,
        filePath: absoluteFilePath,
        fileUrl
      }
    });
  });
}); 