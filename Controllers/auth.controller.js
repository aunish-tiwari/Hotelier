exports.getLogin = (req,res)=>{
    res.render('login');
}

exports.getRegister = (req,res)=>{
    res.render('register');
}

exports.postRegister = (req,res)=>{
    const {name,email,password,phone} = req.body;
    console.log('Registering user:', {name,email,phone});
}

exports.postLogin = (req,res)=>{
    const {email,password} = req.body;
    console.log('Logging in user:', {email});
}