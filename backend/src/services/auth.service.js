const admin = require('../config/firebase.config');

// In a real-world application, you would fetch user data from your database.
const users = [
    {
        uid: 'unique_user_id_1',
        username: 'testuser',
        password: 'password123' // In a real app, this should be a hashed password
    }
];

class AuthService {
    /**
     * Verifies user credentials.
     * @param {string} username - The user's username.
     * @param {string} password - The user's password.
     * @returns {object|null} The user object if verification is successful, otherwise null.
     */
    verifyUser(username, password) {
        const user = users.find(u => u.username === username && u.password === password);
        return user || null;
    }

    /**
     * Creates a custom Firebase token for the given UID.
     * @param {string} uid - The user's unique ID.
     * @returns {Promise<string>} A promise that resolves with the custom token.
     */
    async createCustomToken(uid) {
        try {
            const customToken = await admin.auth().createCustomToken(uid);
            return customToken;
        } catch (error) {
            console.error('Error creating custom token:', error);
            throw new Error('Failed to create custom token.');
        }
    }
}

module.exports = new AuthService();
