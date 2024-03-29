import mongoose from "mongoose";
const {Schema, model} = mongoose;

const subscriptionSchema = new Schema(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    invoiceNumber: {
      type: String,
      // required: true,
    },
    description: {
      type: String,
    },
    amount: {
      type: String,
      required: true,
      default: 'free',
    },
    plan: {
      type: String,
      required: true,
      enum: ['one', 'six'],
      default : 'one'
    },
    taskType: {
      type: String,
      required: true,
      enum: ['Individual', 'Team', 'Organization'],
      default : 'Individual'
    },
    payment_status: {
      type: String,
      required: true,
      enum: ['null', 'paid', 'pending'],
      default: null,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    end_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default model('SubscriptionModel', subscriptionSchema);


