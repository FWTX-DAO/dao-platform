import { PrivyClient } from "@privy-io/server-auth";
import { NextApiRequest } from "next";
import { PinataSDK } from "pinata";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET!;
const client = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) {
  throw new Error("PINATA_JWT environment variable is required");
}

const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
  pinataGatewayKey: process.env.PINATA_GATEWAY_KEY,
});

export async function authenticateRequest(req: NextApiRequest) {
  const headerAuthToken = req.headers.authorization?.replace(/^Bearer /, "");
  const cookieAuthToken = req.cookies["privy-token"];

  const authToken = cookieAuthToken || headerAuthToken;
  if (!authToken) {
    throw new Error("Missing auth token");
  }

  try {
    const claims = await client.verifyAuthToken(authToken);
    return claims;
  } catch (error) {
    throw new Error("Invalid auth token");
  }
}

export { generateId } from "./id-generator";

export const pinataHelpers = {
  async uploadFile(
    file: File,
    options?: {
      name?: string;
      keyvalues?: Record<string, string>;
      groupId?: string;
      network?: "public" | "private";
    },
  ) {
    const network = options?.network || "private";
    const upload =
      network === "public"
        ? pinata.upload.public.file(file)
        : pinata.upload.private.file(file);

    if (options?.name) upload.name(options.name);
    if (options?.keyvalues) upload.keyvalues(options.keyvalues);
    if (options?.groupId) upload.group(options.groupId);

    return await upload;
  },

  async listFiles(
    network: "public" | "private" = "private",
    options?: {
      name?: string;
      group?: string;
      mimeType?: string;
      cid?: string;
      limit?: number;
      order?: "ASC" | "DESC";
      pageToken?: string;
      metadata?: Record<string, string>;
    },
  ) {
    const list =
      network === "public"
        ? pinata.files.public.list()
        : pinata.files.private.list();

    if (options?.name) list.name(options.name);
    if (options?.group) list.group(options.group);
    if (options?.mimeType) list.mimeType(options.mimeType);
    if (options?.cid) list.cid(options.cid);
    if (options?.limit) list.limit(options.limit);
    if (options?.order) list.order(options.order);
    if (options?.pageToken) list.pageToken(options.pageToken);
    if (options?.metadata) list.keyvalues(options.metadata);

    return await list;
  },

  async getFile(id: string, network: "public" | "private" = "private") {
    return network === "public"
      ? await pinata.files.public.get(id)
      : await pinata.files.private.get(id);
  },

  async updateFile(
    id: string,
    options: {
      name?: string;
      keyvalues?: Record<string, string>;
    },
    network: "public" | "private" = "private",
  ) {
    return network === "public"
      ? await pinata.files.public.update({ id, ...options })
      : await pinata.files.private.update({ id, ...options });
  },

  async deleteFile(id: string, network: "public" | "private" = "private") {
    const deleteIds = [id];
    return network === "public"
      ? await pinata.files.public.delete(deleteIds)
      : await pinata.files.private.delete(deleteIds);
  },

  async createDownloadLink(
    cid: string,
    options?: {
      expires?: number;
      date?: number;
      method?: string;
    },
  ) {
    return await pinata.gateways.private.createAccessLink({
      cid,
      expires: options?.expires || 3600,
      date: options?.date || Math.floor(Date.now() / 1000),
    });
  },

  async getFileContent(cid: string, network: "public" | "private" = "private") {
    return network === "public"
      ? await pinata.gateways.public.get(cid)
      : await pinata.gateways.private.get(cid);
  },

  async createGroup(
    name: string,
    isPublic: boolean = false,
    network: "public" | "private" = "private",
  ) {
    return network === "public"
      ? await pinata.groups.public.create({ name, isPublic })
      : await pinata.groups.private.create({ name, isPublic });
  },

  async listGroups(
    network: "public" | "private" = "private",
    options?: {
      name?: string;
      isPublic?: boolean;
      limit?: number;
      pageToken?: string;
    },
  ) {
    const list =
      network === "public"
        ? pinata.groups.public.list()
        : pinata.groups.private.list();

    if (options?.name) list.name(options.name);
    if (options?.isPublic !== undefined) list.isPublic(options.isPublic);
    if (options?.limit) list.limit(options.limit);
    if (options?.pageToken) list.pageToken(options.pageToken);

    return await list;
  },

  async addFileToGroup(
    groupId: string,
    fileId: string,
    network: "public" | "private" = "private",
  ) {
    return network === "public"
      ? await pinata.groups.public.addFiles({ groupId, files: [fileId] })
      : await pinata.groups.private.addFiles({ groupId, files: [fileId] });
  },

  async removeFileFromGroup(
    groupId: string,
    fileId: string,
    network: "public" | "private" = "private",
  ) {
    return network === "public"
      ? await pinata.groups.public.removeFiles({ groupId, files: [fileId] })
      : await pinata.groups.private.removeFiles({ groupId, files: [fileId] });
  },
};
