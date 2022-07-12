import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV}` });

// we cannot put this directly into the files, which import this file
// the import order might get changed, because formatter iliek to put all import statements first
// we need to set and load the correct .env, before importing any other files
