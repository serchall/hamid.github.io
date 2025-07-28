const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    shortDescription: {
        type: String,
        maxlength: 200
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
    category: {
        type: String,
        required: true,
        enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'toys', 'other']
    },
    subcategory: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        unique: true,
        required: true
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    videos: [{
        url: String,
        title: String,
        duration: Number
    }],
    specifications: [{
        name: String,
        value: String
    }],
    features: [String],
    tags: [String],
    stock: {
        quantity: {
            type: Number,
            default: 0,
            min: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 5
        },
        trackStock: {
            type: Boolean,
            default: true
        }
    },
    variants: [{
        name: String,
        options: [{
            name: String,
            price: Number,
            stock: Number,
            sku: String
        }]
    }],
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        weight: Number,
        unit: {
            type: String,
            default: 'cm'
        }
    },
    shipping: {
        weight: Number,
        freeShipping: {
            type: Boolean,
            default: false
        },
        shippingCost: {
            type: Number,
            default: 0
        },
        estimatedDays: {
            min: Number,
            max: Number
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
        images: [String],
        helpful: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            helpful: Boolean
        }],
        verified: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    warranty: {
        period: Number,
        type: String,
        description: String
    },
    returnPolicy: {
        days: {
            type: Number,
            default: 14
        },
        conditions: [String]
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
        enum: ['active', 'inactive', 'draft', 'archived'],
        default: 'active'
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
    sales: {
        type: Number,
        default: 0
    },
    revenue: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
    if (this.discount > 0) {
        return this.price - (this.price * this.discount / 100);
    }
    return this.price;
});

// Virtual for isInStock
productSchema.virtual('isInStock').get(function() {
    if (!this.stock.trackStock) return true;
    return this.stock.quantity > 0;
});

// Virtual for isLowStock
productSchema.virtual('isLowStock').get(function() {
    if (!this.stock.trackStock) return false;
    return this.stock.quantity <= this.stock.lowStockThreshold && this.stock.quantity > 0;
});

// Virtual for review count
productSchema.virtual('reviewCount').get(function() {
    return this.reviews.length;
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ sales: -1 });
productSchema.index({ views: -1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ trending: 1, status: 1 });
productSchema.index({ slug: 1 });

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
    if (!this.sku) {
        this.sku = 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    next();
});

// Method to update rating
productSchema.methods.updateRating = function() {
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
productSchema.methods.addReview = function(userId, rating, title, comment) {
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

// Method to increment views
productSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Method to update sales
productSchema.methods.updateSales = function(quantity) {
    this.sales += quantity;
    this.revenue += this.discountedPrice * quantity;
    this.stock.quantity -= quantity;
    return this.save();
};

// Static method to get featured products
productSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ featured: true, status: 'active' })
        .sort({ 'ratings.average': -1, sales: -1 })
        .limit(limit);
};

// Static method to get trending products
productSchema.statics.getTrending = function(limit = 10) {
    return this.find({ trending: true, status: 'active' })
        .sort({ views: -1, sales: -1 })
        .limit(limit);
};

// Static method to search products
productSchema.statics.search = function(query, options = {}) {
    const searchQuery = {
        $text: { $search: query },
        status: 'active'
    };

    if (options.category) {
        searchQuery.category = options.category;
    }

    if (options.minPrice || options.maxPrice) {
        searchQuery.price = {};
        if (options.minPrice) searchQuery.price.$gte = options.minPrice;
        if (options.maxPrice) searchQuery.price.$lte = options.maxPrice;
    }

    return this.find(searchQuery)
        .sort({ score: { $meta: 'textScore' } })
        .limit(options.limit || 20);
};

module.exports = mongoose.model('Product', productSchema); 