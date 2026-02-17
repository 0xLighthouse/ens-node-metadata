#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { privateKeyToAccount } from "viem/accounts";
import type { Schema } from "../src/types";

interface PublishedSchema {
  schemaId: string;
  version: string;
  cid: string;
  checksum: string;
  timestamp: number;
  schemaPath: string;
  publisher: string;
  notes?: string;
  title?: string;
  description?: string;
  source?: string;
  signer?: string;
  signature?: string;
  eip712?: object;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagesRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packagesRoot, "..", "..");

const args = process.argv.slice(2);
const arg = (long: string, short?: string) => {
  const i = args.indexOf(long);
  if (i >= 0) return args[i + 1];
  if (short) {
    const j = args.indexOf(short);
    if (j >= 0) return args[j + 1];
  }
  return undefined;
};
const hasFlag = (flag: string) => args.includes(flag);

const usage = () => {
  console.log(
    [
      "Usage: pnpm --filter @ensipXX/schemas publish:schema -- --id <schemaId> [--bump patch|minor|major|x.y.z]",
      "Options:",
      "  --id, -i        Schema id (file base name in packages/schemas/src/schemas)",
      "  --bump, -b      Semver bump (patch|minor|major) or explicit version (optional)",
      "  --notes         Short note for run log",
      "  --provider      Publish provider: pinata|ipfs (default: auto)",
      "  --ipfs-cmd      IPFS publish command (default: \"ipfs add -q\")",
      "  --pinata-jwt    Pinata JWT (or PINATA_JWT)",
      "  --pinata-key    Pinata API key (or PINATA_API_KEY)",
      "  --pinata-secret Pinata API secret (or PINATA_API_SECRET)",
      "  --private-key  Hex private key for EIP-712 signing (or SCHEMA_PUBLISHER_PRIVATE_KEY)",
      "  --chain-id     Optional chain id for EIP-712 domain",
      "  --allow-unsigned  Allow publish without signature",
      "  --dry-run       Skip IPFS publish and write files with cid placeholder",
    ].join("\n"),
  );
};

const schemaIdRaw = arg("--id", "-i");
if (!schemaIdRaw) {
  usage();
  process.exit(1);
}

const schemaId = schemaIdRaw.replace(/\.ts$/i, "");
const bumpRaw = arg("--bump", "-b");
const bumpFlagUsed = args.includes("--bump") || args.includes("-b");
const notes = arg("--notes");
const ipfsCmd = arg("--ipfs-cmd") ?? process.env.IPFS_CMD ?? "ipfs add -q";
const dryRun = hasFlag("--dry-run");
const allowUnsigned = hasFlag("--allow-unsigned");
const privateKey =
  arg("--private-key") ?? process.env.SCHEMA_PUBLISHER_PRIVATE_KEY;
const chainIdRaw = arg("--chain-id") ?? process.env.SCHEMA_PUBLISHER_CHAIN_ID;
const chainId = chainIdRaw ? Number(chainIdRaw) : undefined;
if (bumpFlagUsed && !bumpRaw) {
  console.error("Missing --bump value. Use patch|minor|major or x.y.z.");
  process.exit(1);
}

if (!privateKey && !allowUnsigned) {
  console.error(
    "Missing signing key. Provide --private-key or SCHEMA_PUBLISHER_PRIVATE_KEY (or use --allow-unsigned).",
  );
  process.exit(1);
}

const pinataJwt = arg("--pinata-jwt") ?? process.env.PINATA_JWT;
const pinataKey = arg("--pinata-key") ?? process.env.PINATA_API_KEY;
const pinataSecret = arg("--pinata-secret") ?? process.env.PINATA_API_SECRET;
const providerArg = arg("--provider") ?? process.env.SCHEMA_PUBLISHER_PROVIDER;
const hasPinataCreds = Boolean(pinataJwt || (pinataKey && pinataSecret));
const provider = (providerArg ??
  (hasPinataCreds ? "pinata" : "ipfs")) as "pinata" | "ipfs";
if (provider === "pinata" && !hasPinataCreds && !dryRun) {
  console.error(
    "Pinata selected but credentials missing. Provide PINATA_JWT or PINATA_API_KEY/PINATA_API_SECRET.",
  );
  process.exit(1);
}

const schemaFile = path.join(packagesRoot, "src", "schemas", `${schemaId}.ts`);
if (!fs.existsSync(schemaFile)) {
  console.error(`Schema file not found: ${schemaFile}`);
  process.exit(1);
}

const fileText = fs.readFileSync(schemaFile, "utf8");
const versionMatch = fileText.match(/version:\s*['"](\d+\.\d+\.\d+)['"]/);
if (!versionMatch) {
  console.error(`Could not find version in ${schemaFile}`);
  process.exit(1);
}

const currentVersion = versionMatch[1];
const nextVersion = bumpRaw
  ? bumpVersion(currentVersion, bumpRaw)
  : currentVersion;

const publishedRoot = path.join(packagesRoot, "published");
const schemaRoot = path.join(publishedRoot, schemaId);
const registryPath = path.join(publishedRoot, "_registry.json");
const indexPath = path.join(schemaRoot, "index.json");

const registryCheck = readJson(registryPath, { schemas: {} as Record<string, any> });
const publishedByRegistry =
  registryCheck.schemas?.[schemaId]?.published?.[nextVersion];
const indexCheck = readJson(indexPath, { published: [] as Array<any> });
const publishedByIndex = Array.isArray(indexCheck.published)
  ? indexCheck.published.some((entry) => entry?.version === nextVersion)
  : false;
if (publishedByRegistry || publishedByIndex) {
  console.error(
    `Version ${nextVersion} for ${schemaId} is already published. Bump version or choose a new one.`,
  );
  process.exit(1);
}

if (bumpRaw && nextVersion !== currentVersion) {
  const updatedVersionLiteral = versionMatch[0].replace(
    currentVersion,
    nextVersion,
  );
  const updatedText = fileText.replace(versionMatch[0], updatedVersionLiteral);
  fs.writeFileSync(schemaFile, updatedText);
}

const schema = await loadSchema(schemaFile);
schema.version = nextVersion;

const timestamp = Math.floor(Date.now() / 1000);
const versionRoot = path.join(schemaRoot, "versions", nextVersion);
const runsRoot = path.join(schemaRoot, "runs", "ipfs");

fs.mkdirSync(versionRoot, { recursive: true });
fs.mkdirSync(runsRoot, { recursive: true });

const schemaJsonPath = path.join(versionRoot, "schema.json");
const schemaJson = JSON.stringify(schema, null, 2) + "\n";
fs.writeFileSync(schemaJsonPath, schemaJson, "utf8");

const checksum = `sha256:${hashSha256(schemaJson)}`;
fs.writeFileSync(path.join(versionRoot, "checksum.sha256"), `${checksum}\n`, "utf8");

const publishResult = dryRun
  ? { cid: "dry-run", publisher: provider }
  : await publishSchema({
    provider,
    filePath: schemaJsonPath,
    ipfsCmd,
    pinataJwt,
    pinataKey,
    pinataSecret,
    schemaId,
    version: nextVersion,
  });
const { cid, publisher } = publishResult;
fs.writeFileSync(path.join(versionRoot, "cid.txt"), `${cid}\n`, "utf8");

const schemaPath = toRepoPath(schemaJsonPath);
const publishedEntry = {
  cid,
  checksum,
  timestamp,
  schemaPath,
};

const meta: PublishedSchema = {
  schemaId,
  version: nextVersion,
  title: schema.title,
  description: schema.description,
  source: schema.source,
  cid,
  checksum,
  timestamp,
  schemaPath,
  publisher,
  notes,
};
const eip712 = buildEip712({
  schemaId,
  version: nextVersion,
  cid,
  checksum,
  timestamp,
  schemaPath,
  publisher,
  notes: notes ?? "",
}, chainId);
const signed = await maybeSign(eip712, privateKey);
if (signed) {
  meta.signer = signed.signer;
  meta.signature = signed.signature;
  meta.eip712 = eip712;
}
writeJson(path.join(versionRoot, "meta.json"), meta);

const run: PublishedSchema = {
  schemaId,
  version: nextVersion,
  cid,
  checksum,
  timestamp,
  schemaPath,
  publisher,
  notes,
};
if (signed) {
  run.signer = signed.signer;
  run.signature = signed.signature;
  run.eip712 = eip712;
}
const runPath = path.join(runsRoot, `run-${timestamp}.json`);
writeJson(runPath, run);
writeJson(path.join(runsRoot, "run-latest.json"), run);

const latestPath = path.join(publishedRoot, "_latest.json");

const registry = readJson(registryPath, { schemas: {} as Record<string, any> });
registry.schemas[schemaId] ??= { latest: nextVersion, published: {} };
registry.schemas[schemaId].latest = nextVersion;
registry.schemas[schemaId].published[nextVersion] = publishedEntry;
writeJson(registryPath, registry);

const latest = readJson(latestPath, {} as Record<string, any>);
latest[schemaId] = {
  version: nextVersion,
  cid,
  checksum,
  timestamp,
  ...(signed
    ? { signer: signed.signer, signature: signed.signature, eip712 }
    : {}),
};
writeJson(latestPath, latest);

const index = readJson(indexPath, {
  schemaId,
  latest: nextVersion,
  published: [] as Array<any>,
});
index.schemaId = schemaId;
index.latest = nextVersion;
index.published = upsertPublished(index.published, {
  version: nextVersion,
  ...publishedEntry,
});
writeJson(indexPath, index);

console.log(`Published ${schemaId}@${nextVersion}`);
console.log(`CID: ${cid}`);
if (signed) {
  console.log(`Signer: ${signed.signer}`);
}

function bumpVersion(current: string, bump: string) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;
  const [major, minor, patch] = current.split(".").map((v) => Number(v));
  if ([major, minor, patch].some((v) => Number.isNaN(v))) {
    throw new Error(`Invalid current version: ${current}`);
  }
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid bump: ${bump}`);
  }
}

async function loadSchema(filePath: string): Promise<Schema> {
  const moduleUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
  const mod = await import(moduleUrl);
  const candidates = Object.values(mod).filter(isSchema);
  if (candidates.length === 0) {
    throw new Error(`No Schema export found in ${filePath}`);
  }
  return candidates[0];
}

function isSchema(value: unknown): value is Schema {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.version === "string" &&
    typeof v.properties === "object" &&
    v.properties !== null &&
    v.type === "object"
  );
}

function hashSha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function publishToIpfs(cmd: string, filePath: string) {
  const output = execSync(`${cmd} ${filePath}`, { encoding: "utf8" }).trim();
  const lines = output.split(/\r?\n/).filter(Boolean);
  const last = lines[lines.length - 1] ?? "";
  const parts = last.split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts[0] === "added" && parts[1]) return parts[1];
  return parts[parts.length - 1];
}

async function publishSchema(input: {
  provider: "pinata" | "ipfs";
  filePath: string;
  ipfsCmd: string;
  pinataJwt?: string;
  pinataKey?: string;
  pinataSecret?: string;
  schemaId: string;
  version: string;
}): Promise<{ cid: string; publisher: string }> {
  if (input.provider === "ipfs") {
    return { cid: publishToIpfs(input.ipfsCmd, input.filePath), publisher: "ipfs" };
  }
  const cid = await publishToPinata({
    filePath: input.filePath,
    jwt: input.pinataJwt,
    apiKey: input.pinataKey,
    apiSecret: input.pinataSecret,
    schemaId: input.schemaId,
    version: input.version,
  });
  return { cid, publisher: "pinata" };
}

async function publishToPinata(input: {
  filePath: string;
  jwt?: string;
  apiKey?: string;
  apiSecret?: string;
  schemaId: string;
  version: string;
}) {
  const buffer = await fs.promises.readFile(input.filePath);
  const form = new FormData();
  form.set("file", new Blob([buffer]), path.basename(input.filePath));
  form.set(
    "pinataMetadata",
    JSON.stringify({
      name: `${input.schemaId}@${input.version}`,
      keyvalues: {
        schemaId: input.schemaId,
        version: input.version,
      },
    }),
  );
  const headers: Record<string, string> = {};
  if (input.jwt) {
    headers.Authorization = `Bearer ${input.jwt}`;
  } else if (input.apiKey && input.apiSecret) {
    headers.pinata_api_key = input.apiKey;
    headers.pinata_secret_api_key = input.apiSecret;
  }
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers,
      body: form,
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} ${text}`);
  }
  const data = (await response.json()) as { IpfsHash?: string };
  if (!data.IpfsHash) {
    throw new Error("Pinata response missing IpfsHash");
  }
  return data.IpfsHash;
}

function toRepoPath(absPath: string) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function upsertPublished(
  entries: Array<{ version: string }>,
  next: { version: string },
) {
  const existing = entries.findIndex((item) => item.version === next.version);
  if (existing >= 0) {
    entries[existing] = next;
    return entries;
  }
  return [...entries, next];
}

function buildEip712(
  message: {
    schemaId: string;
    version: string;
    cid: string;
    checksum: string;
    timestamp: number;
    schemaPath: string;
    publisher: string;
    notes: string;
  },
  chainId?: number,
) {
  const domain: Record<string, string | number> = {
    name: "ENS Schema Publisher",
    version: "1",
  };
  if (Number.isFinite(chainId)) {
    domain.chainId = chainId as number;
  }
  const types = {
    PublishedSchema: [
      { name: "schemaId", type: "string" },
      { name: "version", type: "string" },
      { name: "cid", type: "string" },
      { name: "checksum", type: "string" },
      { name: "timestamp", type: "uint256" },
      { name: "schemaPath", type: "string" },
      { name: "publisher", type: "string" },
      { name: "notes", type: "string" },
    ],
  };
  return {
    domain,
    types,
    primaryType: "PublishedSchema" as const,
    message,
  };
}

async function maybeSign(
  eip712: ReturnType<typeof buildEip712>,
  privateKeyValue?: string,
): Promise<{ signer: string; signature: string } | null> {
  if (!privateKeyValue) return null;
  const account = privateKeyToAccount(privateKeyValue as `0x${string}`);
  const signature = await account.signTypedData({
    domain: eip712.domain,
    types: eip712.types,
    primaryType: eip712.primaryType,
    message: eip712.message,
  });
  return { signer: account.address, signature };
}
