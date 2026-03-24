const express = require('express');
const app = express();
const authRoutes = require('./Routes/auth.routes');
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/', authRoutes);

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
})