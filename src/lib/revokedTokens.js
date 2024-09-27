const revokedTokens = new Set();

export function revokeToken(token) {
    revokedTokens.add(token);
    console.log(`Token revocado: ${token}`);
}

export const isTokenRevoked = (token) => {
    return revokedTokens.has(token);
};

export const checkRevokedToken = (req, res, next) => {
    const token = req.headers['authorization'].split(' ')[1];
    if (isTokenRevoked(token)) {
        return res.status(401).send({ message: 'Token revocado' });
    }
    next();
};