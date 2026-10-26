const express = require('express');
const app = express();
const router = require('./routes/cutoffroutes');
const mongoose = require('mongoose');

app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/MahaEngineeringCET';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
