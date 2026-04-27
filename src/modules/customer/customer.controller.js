const CustomerRepository = require("../../repositories/customer.repository");

/**
 * Get customer details by Customer ID (CID)
 * Uses the customerId from the JWT token (set by auth middleware)
 */
exports.getCustomerById = async (req, res) => {
    try {
        const customerId = req.customer?.id || req.customer?.customerId; // From JWT via protect middleware

        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: "Customer ID is required"
            });
        }

        const customer = await CustomerRepository.findCustomerById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: "Customer not found"
            });
        }

        res.json({
            success: true,
            customer: {
                id: customer.CID,
                firstName: customer.CFN || "",
                middleName: customer.CMN || "",
                lastName: customer.CLN || "",
                phone: customer.CDN || "",
                alternatePhone: customer.CANN || "",
                email: customer.CSPIN || "",
                dob: customer.CDOB || "",
                addressLine1: customer.CADL1 || "",
                addressLine2: customer.CADL2 || "",
                city: customer.CADCT || "",
                state: customer.CADST || "",
                postalCode: customer.CADZ || "",
                isVerified: customer.CTL === 1
            }
        });

    } catch (error) {
        console.error("❌ Get Customer Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.updateCustomerById = async (req, res) => {
    try {
        const customerId = req.customer?.id || req.customer?.customerId;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: "Customer ID is required"
            });
        }

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

        // ✅ PASTE IT HERE
        const updatePayload = {};

        if (firstName !== undefined) updatePayload.CFN = firstName;
        if (middleName !== undefined) updatePayload.CMN = middleName;
        if (lastName !== undefined) updatePayload.CLN = lastName;
        if (phone !== undefined) updatePayload.CRMN = phone;
        if (alternatePhone !== undefined) updatePayload.CRAMN = alternatePhone;
        if (email !== undefined) updatePayload.CSPIN = email;
        if (dob !== undefined) updatePayload.CDOB = dob;
        if (addressLine1 !== undefined) updatePayload.CADL1 = addressLine1;
        if (addressLine2 !== undefined) updatePayload.CADL2 = addressLine2;
        if (city !== undefined) updatePayload.CADCT = city;
        if (state !== undefined) updatePayload.CADST = state;
        if (postalCode !== undefined) updatePayload.CADZ = postalCode;

        const updatedCustomer = await CustomerRepository.updateCustomerById(
            customerId,
            updatePayload
        );

        if (!updatedCustomer) {
            return res.status(404).json({
                success: false,
                error: "Customer not found"
            });
        }

        res.json({
            success: true,
            message: "Customer updated successfully",
            customer: {
                id: updatedCustomer.CID,
                firstName: updatedCustomer.CFN || "",
                middleName: updatedCustomer.CMN || "",
                lastName: updatedCustomer.CLN || "",
                phone: updatedCustomer.CRMN || "",
                alternatePhone: updatedCustomer.CRAMN || "",
                email: updatedCustomer.CSPIN || "",
                dob: updatedCustomer.CDOB || "",
                addressLine1: updatedCustomer.CADL1 || "",
                addressLine2: updatedCustomer.CADL2 || "",
                city: updatedCustomer.CADCT || "",
                state: updatedCustomer.CADST || "",
                postalCode: updatedCustomer.CADZ || "",
                isVerified: updatedCustomer.CTL === 1
            }
        });

    } catch (error) {
        console.error("❌ Update Customer Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/* Amol */
exports.getCustomerHomeData = async (req, res) => {
    try {
        const customerId = req.customer?.id || req.customer?.customerId; // From JWT via protect middleware

        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: "Customer ID is required"
            });
        }

        const customerHome = await CustomerRepository.findCustomerHomeData(customerId);

        if (!customerHome) {
            return res.status(404).json({
                success: false,
                error: "Customer home data not found"
            });
        }

        res.json({
            success: true,
            customer: {
                id: customerHome.CID,
                ordersCount: customerHome.CORD || "",
                deliveryDistanceKM: customerHome.CDIST || "",
                co2Saving: customerHome.CLN || "",
                airPollutionSaving: customerHome.CDN || "",
                noisePollutionSaving: customerHome.CANN || "",
                treesSaved: customerHome.CSPIN || "",
                greenCreditsEarned: customerHome.CDOB || "",
                lastOrder: customerHome.CADL1 || ""
            }
        });

    } catch (error) {
        console.error("❌ Get CustomerHome Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
