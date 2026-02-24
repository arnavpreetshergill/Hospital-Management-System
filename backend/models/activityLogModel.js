const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activityLogSchema = new Schema({
    // Legacy/plain fields retained for backward compatibility.
    action: { type: String },
    actionEncrypted: { type: String },
    actionHash: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userHospitalID: { type: String },
    userHospitalIDEncrypted: { type: String },
    userRole: { type: String },
    userRoleEncrypted: { type: String },
    details: { type: Schema.Types.Mixed },
    detailsEncrypted: { type: String },
    ip: { type: String },
    ipEncrypted: { type: String },
    signature: { type: String },
    signatureEncrypted: { type: String },
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
