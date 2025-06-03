import mongoose, { Schema } from 'mongoose';
const ptoRequestSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    hours: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied'],
        default: 'pending'
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvalDate: {
        type: Date,
        default: null
    },
    expiryYear: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});
// Virtual field to get the month of the request
ptoRequestSchema.virtual('month').get(function () {
    return this.date.getMonth();
});
// Ensure virtuals are included in JSON
ptoRequestSchema.set('toJSON', { virtuals: true });
ptoRequestSchema.set('toObject', { virtuals: true });
export default mongoose.model('PTORequest', ptoRequestSchema);
