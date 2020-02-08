const mongoose = require('mongoose');
const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

let UserSchema = new Schema({
        username: { type: String, required: true, unique: true },
        password: 'string',
        email:  { type: String, required: true, unique: true },
        firstname: String,
        lastname: String,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        roles: 'array',
    }
    ,{
        timestamps: true
    });

UserSchema.virtual('userId').get(function(){
    return this._id;
});


// Export the model
module.exports = mongoose.model('user', UserSchema);