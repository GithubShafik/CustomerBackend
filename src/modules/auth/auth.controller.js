const CustomerRepository = require("../../repositories/customer.repository");
const { generateOTP } = require("../../utils/GenerateOTP");
const axios = require("axios");
const { normalizePhone } = require("../../utils/phone");
const jwt = require("jsonwebtoken");

const otpStorage = new Map();

/* ---------------- REGISTER ---------------- */

exports.registerCustomer = async (req, res) => {
    try {
        const {
            firstName,
            middleName,
            lastName,
            phone,
            alternatePhone,
            email,
            dob,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode
        } = req.body;

        if (!firstName || !phone) {
            return res.status(400).json({
                success: false,
                error: "First name and phone are required"
            });
        }

        const normalizedPhone = normalizePhone(phone);
        const normalizedAlternatePhone = alternatePhone
            ? normalizePhone(alternatePhone)
            : "";

        if (
            normalizedAlternatePhone &&
            normalizedAlternatePhone === normalizedPhone
        ) {
            return res.status(400).json({
                success: false,
                error: "Alternate phone cannot be same as primary phone"
            });
        }

        const existing =
            await CustomerRepository.findCustomerByPhone(normalizedPhone);

        if (existing) {
            return res.status(409).json({
                success: false,
                error: "Customer already exists"
            });
        }

        const customerId = CustomerRepository.generateCustomerId();

        const customerData = {
            CID: customerId,
            CFN: firstName || "",
            CMN: middleName || "",
            CLN: lastName || "",
            CDN: normalizedPhone,
            CANN: normalizedAlternatePhone,
            CTL: 0,
            email: email || "",
            dob: dob || "",
            addressLine1: addressLine1 || "",
            addressLine2: addressLine2 || "",
            city: city || "",
            state: state || "",
            postalCode: postalCode || ""
        };

        await CustomerRepository.createCustomer(customerData);

        res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            customer: {
                id: customerId,
                firstName,
                lastName,
                phone: normalizedPhone,
                alternatePhone: normalizedAlternatePhone
            }
        });
    } catch (error) {
        console.error("❌ Registration Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
/* ---------------- SEND OTP ---------------- */


exports.registerAndSendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        const normalizedPhone = normalizePhone(phone);
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        console.log("SEND OTP:", normalizedPhone, otp); // debug

        // const response = await axios.get(
        //     `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${normalizedPhone}/${otp}`
        // );

        // if (response.data.Status !== "Success") {
        // if (otp) {
        //     return res.status(500).json({
        //         success: false,
        //         error: "Failed to send OTP"
        //     });
        // }

        otpStorage.set(normalizedPhone, {
            code: otp,
            createdAt: new Date()
        });

        res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};
/* ---------------- VERIFY OTP ---------------- */

exports.verifyOtpAndLogin = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        const normalizedPhone = normalizePhone(phone);
        const storedOtp = otpStorage.get(normalizedPhone);

        if (!storedOtp) {
            return res.status(400).json({
                success: false,
                error: "OTP not found"
            });
        }

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        if (storedOtp.createdAt < tenMinutesAgo) {
            otpStorage.delete(normalizedPhone);
            return res.status(400).json({
                success: false,
                error: "OTP expired"
            });
        }

        if (storedOtp.code !== String(otp).trim()) {
            return res.status(400).json({
                success: false,
                error: "Invalid OTP"
            });
        }

        otpStorage.delete(normalizedPhone);

        let customer =
            await CustomerRepository.findCustomerByPhone(normalizedPhone);

        if (!customer) {
            const customerId = CustomerRepository.generateCustomerId();

            customer = await CustomerRepository.createCustomer({
                CID: customerId,
                CDN: normalizedPhone,
                CTL: 0
            });
        }

        // generate token
        const token = jwt.sign(
            { id: customer.CID, phone: normalizedPhone },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "OTP verified",
            customer,
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};