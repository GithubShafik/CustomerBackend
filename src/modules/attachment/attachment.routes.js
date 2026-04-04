const express = require("express");
const router = express.Router();
const multer = require("multer");

const attachmentController = require("./attachment.controller");

// Multer memory storage (keeps file in buffer for S3 upload)
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

/**
 * @swagger
 * /api/attachment/uploads:
 *   post:
 *     summary: Upload an image/file attachment
 *     tags: [Attachment]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     url:
 *                       type: string
 *                       format: uri
 *                     fileName:
 *                       type: string
 *                     fileType:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Internal server error
 */
router.post("/uploads", upload.single("file"), attachmentController.uploadAttachment);

/**
 * @swagger
 * /api/attachment/attachment:
 *   get:
 *     summary: Get a single attachment by ID
 *     tags: [Attachment]
 *     parameters:
 *       - in: query
 *         name: AttID
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attachment ID (AttID)
 *     responses:
 *       200:
 *         description: Attachment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *       404:
 *         description: Attachment not found
 *       500:
 *         description: Internal server error
 */
router.get("/attachment", attachmentController.getAttachment);

/**
 * @swagger
 * /api/attachment/attachments:
 *   get:
 *     summary: Get all attachments
 *     tags: [Attachment]
 *     responses:
 *       200:
 *         description: Attachments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.get("/attachments", attachmentController.getAllAttachments);

module.exports = router;
