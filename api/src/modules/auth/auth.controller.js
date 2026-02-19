const authService = require('./auth.service');

const register = async (req, res,next ) => {
    try{
        const { companyName, email, password } = req.body;
        const tokens = await authService.register({ companyName, email, password });
        res.cookie("refreshToken", tokens.refreshToken, {
  httpOnly: true,
  secure: false, // true in production (HTTPS)
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

return res.status(201).json({
  accessToken: tokens.accessToken,
});

    }catch(error){
        next(error);

    }

};

const login = async (req, res,next) => {
    try{
        const { email, password } = req.body;
        const tokens = await authService.login({ email, password });
    res.cookie("refreshToken", tokens.refreshToken, {
  httpOnly: true,
  secure: false, // true in production (HTTPS)
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

return res.status(200).json({
  accessToken: tokens.accessToken,
});

    }catch(error){
        next(error);
    }

};

const refresh= async (req, res,next) => {
    try{
        const  refreshToken = req.cookies.refreshToken
          if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
        const tokens = await authService.refresh( refreshToken );
        //setting the new refresh token in the cookie
          res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
          return res.status(200).json({
      accessToken: tokens.accessToken,
    });
    }catch(error){
        next(error);
    }   
};

const logout = async (req, res,next) => {
    try{
        const  refreshToken = req.cookies.refreshToken 
        await authService.logout(refreshToken);
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out successfully" });
    }catch(error){
        next(error);
    }
};

module.exports = {
    register,
    login,
    refresh,
    logout
}




