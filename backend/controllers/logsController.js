const ActivityLog = require('../models/activityLogModel');
const { decryptAes, hashValue } = require('../utils/encryption');

function parseLimit(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return 100;
    return Math.min(parsed, 500);
}

function parseEncryptedJson(value, fallback) {
    if (!value) return fallback;
    try {
        return JSON.parse(decryptAes(value));
    } catch {
        return fallback;
    }
}

const getLogs = async (req, res) => {
    const { action, limit = 100 } = req.query;
    const filter = {};
    if (action) {
        const actionHash = hashValue(action);
        filter.$or = [
            { actionHash },
            { action },
        ];
    }

    const logs = await ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseLimit(limit))
        .lean();

    const decrypted = logs.map((log) => {
        let resolvedAction = log.action;
        if (log.actionEncrypted) {
            try {
                resolvedAction = decryptAes(log.actionEncrypted);
            } catch {
                resolvedAction = log.action;
            }
        }

        let userHospitalID = log.userHospitalID;
        if (log.userHospitalIDEncrypted) {
            try {
                userHospitalID = decryptAes(log.userHospitalIDEncrypted);
            } catch {
                userHospitalID = log.userHospitalID;
            }
        }

        let userRole = log.userRole;
        if (log.userRoleEncrypted) {
            try {
                userRole = decryptAes(log.userRoleEncrypted);
            } catch {
                userRole = log.userRole;
            }
        }

        let ip = log.ip;
        if (log.ipEncrypted) {
            try {
                ip = decryptAes(log.ipEncrypted);
            } catch {
                ip = log.ip;
            }
        }

        let signature = log.signature;
        if (log.signatureEncrypted) {
            try {
                signature = decryptAes(log.signatureEncrypted);
            } catch {
                signature = log.signature;
            }
        }

        return {
            _id: log._id,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
            action: resolvedAction,
            userId: log.userId,
            userHospitalID,
            userRole,
            details: parseEncryptedJson(log.detailsEncrypted, log.details),
            ip,
            signature,
        };
    });

    res.status(200).json(decrypted);
};

module.exports = { getLogs };
