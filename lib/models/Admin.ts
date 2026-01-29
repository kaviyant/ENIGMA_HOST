import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, default: 'admin' },
    password: { type: String, required: true, default: 'admin' } // In a real app this should be hashed
}, { minimize: false });

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
