const ActivityLog = require('../models/activityLogModel');
const { signRsa, encryptAes, hashValue } = require('./encryption');

function safeStringify(value) {
    try {
        return JSON.stringify(value);
    } catch {
        return JSON.stringify({ error: 'Failed to serialize details' });
    }
}

async function logActivity(action, user, details = {}, req) {
    try {
        const ip = req?.ip || req?.connection?.remoteAddress || null;
        const payload = safeStringify({
            action,
            userHospitalID: user?.HospitalID,
            userRole: user?.role,
            details,
            ip,
            ts: new Date().toISOString()
        });
        const signature = signRsa(payload);
        await ActivityLog.create({
            action: hashValue(action),
            actionEncrypted: encryptAes(action),
            actionHash: hashValue(action),
            userId: user?._id,
            userHospitalID: user?.HospitalID ? hashValue(user.HospitalID) : undefined,
            userHospitalIDEncrypted: user?.HospitalID ? encryptAes(user.HospitalID) : undefined,
            userRole: user?.role ? hashValue(user.role) : undefined,
            userRoleEncrypted: user?.role ? encryptAes(user.role) : undefined,
            details: hashValue(safeStringify(details)),
            detailsEncrypted: encryptAes(safeStringify(details)),
            ip: ip ? hashValue(ip) : undefined,
            ipEncrypted: ip ? encryptAes(ip) : undefined,
            signature: signature ? hashValue(signature) : undefined,
            signatureEncrypted: signature ? encryptAes(signature) : undefined,
        });
    } catch (err) {
        console.error('Failed to write activity log:', err.message);
    }
}

module.exports = { logActivity };
