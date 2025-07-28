const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['video', 'text', 'quiz', 'assignment', 'live'],
        default: 'video'
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    videoUrl: String,
    videoThumbnail: String,
    attachments: [{
        name: String,
        url: String,
        size: Number,
        type: String
    }],
    order: {
        type: Number,
        required: true
    },
    isFree: {
        type: Boolean,
        default: false
    },
    requirements: [String],
    objectives: [String],
    resources: [{
        title: String,
        url: String,
        type: String
    }],
    quiz: {
        questions: [{
            question: String,
            options: [String],
            correctAnswer: Number,
            explanation: String
        }],
        passingScore: {
            type: Number,
            default: 70
        },
        timeLimit: Number // in minutes
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    }
}, {
    timestamps: true
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    subtitle: {
        type: String,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    shortDescription: {
        type: String,
        maxlength: 300
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['programming', 'design', 'business', 'marketing', 'languages', 'music', 'photography', 'cooking', 'fitness', 'other']
    },
    subcategory: {
        type: String,
        trim: true
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    language: {
        type: String,
        default: 'Persian'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    currency: {
        type: String,
        default: 'AFN'
    },
    thumbnail: {
        type: String,
        required: true
    },
    previewVideo: {
        url: String,
        duration: Number,
        thumbnail: String
    },
    images: [{
        url: String,
        alt: String,
        isPrimary: Boolean
    }],
    lessons: [lessonSchema],
    sections: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        order: {
            type: Number,
            required: true
        },
        lessons: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson'
        }]
    }],
    requirements: [String],
    objectives: [String],
    targetAudience: [String],
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    tags: [String],
    duration: {
        total: {
            type: Number, // in minutes
            default: 0
        },
        video: {
            type: Number,
            default: 0
        },
        text: {
            type: Number,
            default: 0
        }
    },
    enrollment: {
        total: {
            type: Number,
            default: 0
        },
        active: {
            type: Number,
            default: 0
        },
        completed: {
            type: Number,
            default: 0
        }
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        },
        distribution: {
            1: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            5: { type: Number, default: 0 }
        }
    },
    reviews: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        title: {
            type: String,
            maxlength: 100
        },
        comment: {
            type: String,
            maxlength: 1000
        },
        verified: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    certificate: {
        enabled: {
            type: Boolean,
            default: true
        },
        template: String,
        requirements: {
            completionRate: {
                type: Number,
                default: 80,
                min: 0,
                max: 100
            },
            minimumLessons: {
                type: Number,
                default: 0
            }
        }
    },
    features: {
        downloadable: {
            type: Boolean,
            default: false
        },
        lifetimeAccess: {
            type: Boolean,
            default: true
        },
        mobileAccess: {
            type: Boolean,
            default: true
        },
        assignments: {
            type: Boolean,
            default: false
        },
        certificate: {
            type: Boolean,
            default: true
        },
        directMessage: {
            type: Boolean,
            default: false
        },
        groupChat: {
            type: Boolean,
            default: false
        }
    },
    seo: {
        title: String,
        description: String,
        keywords: [String],
        slug: {
            type: String,
            unique: true,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'pending'],
        default: 'draft'
    },
    featured: {
        type: Boolean,
        default: false
    },
    trending: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    revenue: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for discounted price
courseSchema.virtual('discountedPrice').get(function() {
    if (this.discount > 0) {
        return this.price - (this.price * this.discount / 100);
    }
    return this.price;
});

// Virtual for total lessons count
courseSchema.virtual('totalLessons').get(function() {
    return this.lessons.length;
});

// Virtual for free lessons count
courseSchema.virtual('freeLessons').get(function() {
    return this.lessons.filter(lesson => lesson.isFree).length;
});

// Virtual for completion rate
courseSchema.virtual('completionRate').get(function() {
    if (this.enrollment.total === 0) return 0;
    return (this.enrollment.completed / this.enrollment.total) * 100;
});

// Indexes for better performance
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ 'ratings.average': -1 });
courseSchema.index({ enrollment: -1 });
courseSchema.index({ views: -1 });
courseSchema.index({ featured: 1, status: 1 });
courseSchema.index({ trending: 1, status: 1 });
courseSchema.index({ slug: 1 });

// Pre-save middleware to calculate duration
courseSchema.pre('save', function(next) {
    if (this.lessons && this.lessons.length > 0) {
        this.duration.total = this.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
        this.duration.video = this.lessons
            .filter(lesson => lesson.type === 'video')
            .reduce((total, lesson) => total + (lesson.duration || 0), 0);
        this.duration.text = this.lessons
            .filter(lesson => lesson.type === 'text')
            .reduce((total, lesson) => total + (lesson.duration || 0), 0);
    }
    next();
});

// Method to update rating
courseSchema.methods.updateRating = function() {
    if (this.reviews.length === 0) {
        this.ratings.average = 0;
        this.ratings.count = 0;
        return;
    }

    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.average = totalRating / this.reviews.length;
    this.ratings.count = this.reviews.length;

    // Update rating distribution
    this.ratings.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.reviews.forEach(review => {
        this.ratings.distribution[review.rating]++;
    });
};

// Method to add review
courseSchema.methods.addReview = function(userId, rating, title, comment) {
    const review = {
        userId,
        rating,
        title,
        comment,
        createdAt: new Date()
    };

    this.reviews.push(review);
    this.updateRating();
    return this.save();
};

// Method to increment enrollment
courseSchema.methods.incrementEnrollment = function() {
    this.enrollment.total += 1;
    this.enrollment.active += 1;
    return this.save();
};

// Method to increment views
courseSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Static method to get featured courses
courseSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ featured: true, status: 'published' })
        .populate('instructor', 'firstName lastName profilePic')
        .sort({ 'ratings.average': -1, enrollment: -1 })
        .limit(limit);
};

// Static method to get trending courses
courseSchema.statics.getTrending = function(limit = 10) {
    return this.find({ trending: true, status: 'published' })
        .populate('instructor', 'firstName lastName profilePic')
        .sort({ views: -1, enrollment: -1 })
        .limit(limit);
};

// Static method to search courses
courseSchema.statics.search = function(query, options = {}) {
    const searchQuery = {
        $text: { $search: query },
        status: 'published'
    };

    if (options.category) {
        searchQuery.category = options.category;
    }

    if (options.level) {
        searchQuery.level = options.level;
    }

    if (options.minPrice || options.maxPrice) {
        searchQuery.price = {};
        if (options.minPrice) searchQuery.price.$gte = options.minPrice;
        if (options.maxPrice) searchQuery.price.$lte = options.maxPrice;
    }

    return this.find(searchQuery)
        .populate('instructor', 'firstName lastName profilePic')
        .sort({ score: { $meta: 'textScore' } })
        .limit(options.limit || 20);
};

module.exports = mongoose.model('Course', courseSchema); 