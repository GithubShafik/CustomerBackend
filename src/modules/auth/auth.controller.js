const CustomerRepository = require("../../repositories/customer.repository");
const { generateOTP } = require("../../utils/GenerateOTP");
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

exports.registerAndSendOtp = async (req,res)=>{

    try{

        const { phone } = req.body;

        if(!phone){

            return res.status(400).json({
                success:false,
                error:"Phone required"
            });
        }

        const normalizedPhone = normalizePhone(phone);

        const otp = generateOTP();

        otpStorage.set(normalizedPhone,{
            otp,
            timestamp:Date.now()
        });

        console.log(`OTP for ${normalizedPhone}: ${otp}`);

        res.json({
            success:true,
            message:"OTP sent",
            dev_otp:otp
        });

    }catch(error){

        res.status(500).json({
            success:false,
            error:error.message
        });
    }
};


/* ---------------- VERIFY OTP ---------------- */

exports.verifyOtpAndLogin = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        const normalizedPhone = normalizePhone(phone);
        const record = otpStorage.get(normalizedPhone);

        if (!record) {
            return res.status(400).json({
                success: false,
                error: "OTP not found"
            });
        }

        if (Date.now() - record.timestamp > 600000) {
            otpStorage.delete(normalizedPhone);

            return res.status(400).json({
                success: false,
                error: "OTP expired"
            });
        }

        if (record.otp !== otp) {
            return res.status(400).json({
                success: false,
                error: "Invalid OTP"
            });
        }

        // ✅ Find existing customer
        let customer = await CustomerRepository.findCustomerByPhone(normalizedPhone);

        // ✅ AUTO CREATE IF NOT FOUND
        if (!customer) {
            customer = await CustomerRepository.createCustomer({
                CID: CustomerRepository.generateCustomerId(),
                CFN: "New",
                CMN: "",
                CLN: "Customer",
                CDN: normalizedPhone,
                CTL: 1,
                email: "",
                dob: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                postalCode: ""
            });
        }

        await CustomerRepository.updateCustomerVerification(normalizedPhone);

        otpStorage.delete(normalizedPhone);

        const token = jwt.sign(
            {
                customerId: customer.CID
            },
            process.env.JWT_SECRET || "dev_secret",
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            customer: {
                id: customer.CID,
                firstName: customer.CFN,
                lastName: customer.CLN
            }
        });

    } catch (error) {
        console.error("❌ OTP Verify Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};