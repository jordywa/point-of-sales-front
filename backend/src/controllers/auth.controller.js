const AuthService = require('../services/auth.service');

class AuthController {
    async login(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        try {
            const user = AuthService.verifyUser(username, password);

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            const customToken = await AuthService.createCustomToken(user.uid);
            res.status(200).json({ token: customToken });

        } catch (error) {
            res.status(500).json({ message: 'Internal server error.', error: error.message });
        }
    }
}

module.exports = new AuthController();
