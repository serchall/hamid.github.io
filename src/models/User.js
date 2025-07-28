const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'ایمیل معتبر نیست']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    phone: {
        type: String,
        trim: true,
        match: [/^(\+98|0)?9\d{9}$/, 'شماره تلفن معتبر نیست']
    },
    profilePic: {
        type: String,
        default: '/images/default-avatar.png'
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'instructor'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: {
        type: Date,
        default: Date.now
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    preferences: {
        language: {
            type: String,
            default: 'fa'
        },
        theme: {
            type: String,
            default: 'light'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            }
        }
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'Afghanistan'
        }
    },
    socialLinks: {
        instagram: String,
        telegram: String,
        twitter: String,
        linkedin: String
    },
    enrolledCourses: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        completedLessons: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        }],
        certificate: {
            issued: {
                type: Boolean,
                default: false
            },
            issuedAt: Date,
            certificateId: String
        }
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    cart: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    watchHistory: [{
        videoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video'
        },
        watchedAt: {
            type: Date,
            default: Date.now
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    }],
    achievements: [{
        name: String,
        description: String,
        earnedAt: {
            type: Date,
            default: Date.now
        },
        icon: String
    }],
    points: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for isLocked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'enrolledCourses.courseId': 1 });
userSchema.index({ 'cart.productId': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Method to get user stats
userSchema.methods.getStats = function() {
    return {
        totalCourses: this.enrolledCourses.length,
        completedCourses: this.enrolledCourses.filter(course => course.progress === 100).length,
        totalOrders: this.orders.length,
        totalPoints: this.points,
        level: this.level,
        achievements: this.achievements.length
    };
};

module.exports = mongoose.model('User', userSchema); 