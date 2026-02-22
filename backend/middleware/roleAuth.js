const Authorize =(...allowedRoles) =>
{
    return (req,res,next)=>
    {
        if(!req.user || !req.user.role){
            return res.status(401).json({message: "Unauthorized: no user found"});
            
        }
        const rolesArray = [...allowedRoles];

        if(!rolesArray.includes(req.user.role))
        {
            return res.status(403).json({message: "Forbidden: insufficient permissions"});
        }
        next();
    }
}

module.exports = Authorize;