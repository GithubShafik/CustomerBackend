const admin = require("firebase-admin");

// Initialize Firebase Admin (requires serviceAccountKey.json)
// try {
//     const serviceAccount = require("../../config/serviceAccountKey.json");
//     admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount)
//     });
// } catch (error) {
//     console.warn("FCM not initialized: serviceAccountKey.json missing");
// }

const sendPushNotification = async (token, title, body, data = {}) => {
    try {
        const message = {
            notification: { title, body },
            data,
            token
        };
        const response = await admin.messaging().send(message);
        console.log("Successfully sent push notification:", response);
        return response;
    } catch (error) {
        console.error("Error sending push notification:", error);
        // throw error;
    }
};

module.exports = { sendPushNotification };
