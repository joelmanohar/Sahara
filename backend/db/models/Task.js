const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tasks: [{
        icon: { type: String, default: '📋' },
        category: { type: String },   // bank, insurance, digital, investment, pension, property, tax, legal, utility, government
        name: { type: String },
        sub: { type: String },
        status: {
            type: String,
            enum: ['pending', 'progress', 'submitted', 'done'],
            default: 'pending'
        },
        priority: {
            type: String,
            enum: ['normal', 'important', 'urgent'],
            default: 'normal'
        },
        isImportant: { type: Boolean, default: false },
        isUrgent: { type: Boolean, default: false },
        deadline: { type: String },      // e.g., "within 7 days", "within 30 days"
        deadlineDate: { type: Date },    // computed deadline date
        source: {
            type: String,
            enum: ['chat', 'guidance', 'manual', 'account-detection', 'system'],
            default: 'manual'
        },
        notes: { type: String },
        officialLink: { type: String },  // optional link for the task
        updatedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
