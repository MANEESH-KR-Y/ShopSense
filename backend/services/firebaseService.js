const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendNotification = async (token, title, body) => {
    try {
        const message = {
            notification: {
                title: title,
                body: body
            },
            token: token
        };

        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        return response;
    } catch (error) {
        console.error("Error sending message:", error);
        // Don't throw, just log, to avoid breaking main flows
        return null;
    }
};

// Function to notify all users (broadcasting to a topic would be better, but for now we'll assumes tokens are managed manually or just expose send to specific token)
// In a real app, we'd store device tokens in the `users` table.

module.exports = { sendNotification, admin };
