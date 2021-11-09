import mongoose from 'mongoose';
import * as DocumentTypes from './interfaces';
import { affiliationSchema, authorSchema, paperSchema, userSchema, venueSchema } from './schemas';

export default class Models {
  Affiliation: mongoose.Model<DocumentTypes.Affiliation>;

  Author: mongoose.Model<DocumentTypes.Author>;

  Paper: mongoose.Model<DocumentTypes.Paper>;

  Venue: mongoose.Model<DocumentTypes.Venue>;

  User: mongoose.Model<DocumentTypes.User>;

  constructor() {
    this.Affiliation = mongoose.model<DocumentTypes.Affiliation>('Affiliation', affiliationSchema);
    this.Author = mongoose.model<DocumentTypes.Author>('Author', authorSchema);
    this.Paper = mongoose.model<DocumentTypes.Paper>('Paper', paperSchema);
    this.Venue = mongoose.model<DocumentTypes.Venue>('Venue', venueSchema);
    this.User = mongoose.model<DocumentTypes.User>('User', userSchema);
  }
}
