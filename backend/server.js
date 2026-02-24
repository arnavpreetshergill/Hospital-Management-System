const express = require('express');
const userRoutes = require('./routes/user');
const patientRoutes = require('./routes/patients');
const logRoutes = require('./routes/logs');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

app.use('/users', userRoutes);
app.use('/patients', patientRoutes);
app.use('/logs', logRoutes);

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
.then(() =>
{
    console.log('Connected to MongoDB');
    app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);

    })
}).catch((err) =>{
    console.error("failed to connect to MongoDB", err);
});