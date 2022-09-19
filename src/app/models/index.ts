import mongoose from 'mongoose';
import * as DocumentTypes from './interfaces';
import { authorSchema, paperSchema, userSchema } from './schemas';

export default class Models {
  Author: mongoose.Model<DocumentTypes.Author>;

  Paper: mongoose.Model<DocumentTypes.Paper>;

  User: mongoose.Model<DocumentTypes.User>;

  constructor() {
    this.Author = mongoose.model<DocumentTypes.Author>('Author', authorSchema);
    this.Paper = mongoose.model<DocumentTypes.Paper>('Paper', paperSchema);
    this.User = mongoose.model<DocumentTypes.User>('User', userSchema);
  }
}
