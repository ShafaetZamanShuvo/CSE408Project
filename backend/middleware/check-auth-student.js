const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    if (req.method === "OPTIONS") {
        return next();
    }
    try {
        const token = req.headers.authorization.split(" ")[1]; // Autgorization : 'Bearer TOKEN'
        if (!token) {
            const error = new HttpError("Authentication Failed", 401);
            return next(error);
        }

        const decodedToken = jwt.verify(token, 'supersecret_dont_share_student');
        req.userData = { userId: decodedToken.userId };
        next();


    } catch (err) {
        const error = new HttpError("Authentication Failed", 401);
        return next(error);
    }
};