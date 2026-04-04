const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { connection } = require("../../config/db");

const fs = require("fs");
const path = require("path");

/**
 * Upload an image/file to S3 and save the record in the Attachments table
 * Fallback to local storage if AWS S3 fails.
 */
exports.uploadAttachment = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: "No file uploaded."
            });
        }

        const keyName = `${uuidv4()}_${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        let fileUrl;

        try {
            // Configure AWS S3
            AWS.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
                region: process.env.AWS_BUCKET_REGION,
            });

            const s3 = new AWS.S3();

            // S3 upload parameters
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: keyName,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            // Attempt upload file to S3
            const s3Data = await s3.upload(params).promise();
            fileUrl = s3Data.Location;
            console.log("✅ File uploaded to AWS S3 successfully:", fileUrl);
        } catch (s3Error) {
            console.warn(`⚠️ AWS S3 Upload Failed: ${s3Error.message}. Falling back to local storage...`);
            
            // Local fallback setup
            const uploadDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const localFilePath = path.join(uploadDir, keyName);
            fs.writeFileSync(localFilePath, file.buffer);
            
            // Build local URL for access
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/${keyName}`;
            console.log("📁 File saved locally:", fileUrl);
        }

        // Save attachment record to database
        const attId = uuidv4();
        const now = new Date();

        await connection.query(
            `INSERT INTO Attachments (AttID, AttURL, CAt, UAt) VALUES (?, ?, ?, ?)`,
            [attId, fileUrl, now, now]
        );

        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            result: {
                AttID: attId,
                url: fileUrl,
                fileName: file.originalname,
                fileType: file.mimetype,
                createdAt: now,
                updatedAt: now
            }
        });

    } catch (error) {
        console.error("❌ Upload Attachment Error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Internal server error"
        });
    }
};

/**
 * Get a single attachment by AttID
 */
exports.getAttachment = async (req, res) => {
    try {
        const { AttID } = req.query;

        if (!AttID) {
            return res.status(400).json({
                success: false,
                error: "AttID is required"
            });
        }

        const [rows] = await connection.query(
            "SELECT * FROM Attachments WHERE AttID = ?",
            [AttID]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Attachment not found"
            });
        }

        res.json({
            success: true,
            message: "Attachment retrieved successfully",
            result: rows[0]
        });

    } catch (error) {
        console.error("❌ Get Attachment Error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Internal server error"
        });
    }
};

/**
 * Get all attachments
 */
exports.getAllAttachments = async (req, res) => {
    try {
        const [rows] = await connection.query(
            "SELECT * FROM Attachments ORDER BY CAt DESC"
        );

        res.json({
            success: true,
            message: "Attachments retrieved successfully",
            result: rows
        });

    } catch (error) {
        console.error("❌ Get All Attachments Error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Internal server error"
        });
    }
};
