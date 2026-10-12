import mongoose, { Schema } from "mongoose";

interface IVertinConfig extends Document {
  guild_id: string;
  ctf_notice_channel: string;
}

const VertinConfigSchema: Schema = new Schema(
  {
    guild_id: {
      type: String,
      required: true,
      unique: true,
    },
    ctf_notice_channel: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const VertinConfigModel = mongoose.model<IVertinConfig>(
  "VertinConfig",
  VertinConfigSchema,
);

export default VertinConfigModel;
