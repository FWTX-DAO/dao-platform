"server only"

import { PinataSDK } from "pinata"

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL;

if (!PINATA_JWT) {
  throw new Error("PINATA_JWT environment variable is required");
}

export const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: PINATA_GATEWAY,
})