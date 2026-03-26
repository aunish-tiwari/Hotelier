const express = require('express');
const path = require('path');
const app = express();
const authRoutes = require('./Routes/auth.routes');
const userRoutes = require('./Routes/user.routes');
const adminRoutes = require('./Routes/admin.routes');
const apiRoutes = require('./Routes/api.routes');
const pool = require('./Config/db.config');
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

app.get("/db-test",async (req,res)=>{
    const query = 'SELECT NOW()';
    const result = await pool.query(query)
    res.json(result.rows);
})
app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
})