const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Contraseña de acceso
const contraseñaAdmin = '1503s';

// Configuración de subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Redirección fácil al panel de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bici-admin1031.html'));
});

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Mostrar todas las bicicletas
app.get('/bicicletas', (req, res) => {
  try {
    const data = fs.readFileSync('./data/bicicletas.json');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error leyendo bicicletas:', error);
    res.status(500).json({ error: 'Error al leer los datos.' });
  }
});

// Agregar bicicleta (con verificación de contraseña)
app.post('/agregar', upload.any(), (req, res) => {
  try {
    const { clave } = req.body;

    if (clave !== contraseñaAdmin) {
      return res.status(403).send('Acceso denegado');
    }

    const bicicletas = JSON.parse(fs.readFileSync('./data/bicicletas.json'));

    const nuevasImagenes = req.files
      .filter(file => file.fieldname === 'imagenes')
      .map(file => `/uploads/${file.filename}`);

    const nuevaBici = {
      id: Date.now(),
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      precio: req.body.precio,
      imagenes: nuevasImagenes,
    };

    bicicletas.push(nuevaBici);
    fs.writeFileSync('./data/bicicletas.json', JSON.stringify(bicicletas, null, 2));
    res.redirect('/admin');
  } catch (error) {
    console.error('❌ Error al agregar bicicleta:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Eliminar bicicleta (con verificación de contraseña)
app.post('/eliminar/:id', (req, res) => {
  try {
    const { clave } = req.body;

    if (clave !== contraseñaAdmin) {
      return res.status(403).send('Acceso denegado');
    }

    let bicicletas = JSON.parse(fs.readFileSync('./data/bicicletas.json', 'utf-8'));
    bicicletas = bicicletas.filter(b => b.id != req.params.id);
    fs.writeFileSync('./data/bicicletas.json', JSON.stringify(bicicletas, null, 2));
    res.redirect('/admin');
  } catch (error) {
    console.error('❌ Error al eliminar bicicleta:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚴 Servidor funcionando en http://localhost:${PORT}`);
});
