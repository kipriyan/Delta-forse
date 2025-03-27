const multer = require('multer');
const path = require('path');

// Настройка на съхранението
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/company-logos/');
  },
  filename: function(req, file, cb) {
    cb(null, `company-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Проверка на типа на файла
const fileFilter = (req, file, cb) => {
  // Позволени типове файлове
  const filetypes = /jpeg|jpg|png|gif/;
  // Проверка на разширението
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Проверка на MIME типа
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Само изображения са позволени!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB
  fileFilter: fileFilter
});

module.exports = upload; 