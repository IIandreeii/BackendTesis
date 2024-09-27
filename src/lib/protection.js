function checkRole(role) {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
        }
    };
}

export function isLogin(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect('/profile');
}

export function isDoner(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'donor') {
        return next();
    }
    return res.redirect('/profile');
}


export function isCharity(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'charity') {
        return next();
    }
    return res.redirect('/profile');
}


export function checkRole(role) {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            res.sendStatus(403); 
        }
    };
}





