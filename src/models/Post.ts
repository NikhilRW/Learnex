import mongoose, {Schema, Document} from 'mongoose';

// Interface for Post document
export interface IPost extends Document {
  title: string;
  content: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  comments: mongoose.Types.ObjectId[];
}

// Post Schema
const PostSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
PostSchema.index({title: 'text', content: 'text'});
PostSchema.index({category: 1});
PostSchema.index({tags: 1});
PostSchema.index({author: 1});

// Virtual for post URL
PostSchema.virtual('url').get(function () {
  return `/posts/${this._id}`;
});

// Method to increment likes
PostSchema.methods.incrementLikes = async function () {
  this.likes += 1;
  return this.save();
};

// Method to decrement likes
PostSchema.methods.decrementLikes = async function () {
  if (this.likes > 0) {
    this.likes -= 1;
  }
  return this.save();
};

// Static method to find posts by category
PostSchema.statics.findByCategory = function (category: string) {
  return this.find({category});
};

// Static method to find posts by tags
PostSchema.statics.findByTags = function (tags: string[]) {
  return this.find({tags: {$in: tags}});
};

// Static method to find posts by author
PostSchema.statics.findByAuthor = function (authorId: mongoose.Types.ObjectId) {
  return this.find({author: authorId});
};

// Pre-save middleware to sanitize tags
PostSchema.pre('save', function (next) {
  if (this.tags) {
    this.tags = this.tags.map(tag => tag.toLowerCase().trim());
  }
  next();
});

export default mongoose.model<IPost>('Post', PostSchema);
