import { Schema, Model, model} from "mongoose";
import { ICountry } from "./interfaces";



const CountrySchema = new Schema<ICountry>(
  {
    name: {
      type: String,
      required: true,
      index : 1
    },

    code: { //Calling code
      type: String,
      required: true,
    },

    boundary: {
      type: [Number],
      required: true,
      default: [0.0, 0.0, 0.0, 0.0],
    },

    currency : {
      type : String, 
      required: true 
    },

    paymentProcessorbillingPercentage : {
      type : Number, 
      default : 0, 
    },
    paymentProcessorbillingExtraAmount : {
      type : Number, 
      default : 0, 
    },
    
    driverPercentage : {
      type : Number,
      required : true, 
      default :0
    }, 
    
    riderCommission : {
      type : Number,
      required : true, 
      default :0
    }, 


    requiredDriverDocs:  [
        {
          name : String, 
          options : [ String ]
        }
      ],
    requiredRiderDocs: [
      {
        name: String,
        options: [String]
      }
    ],


  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CountrySchema.index({
  code: 1,
 currency : 1
});

const Country: Model<ICountry> = model<ICountry>(
  "Country",
  CountrySchema
);

export default Country;
