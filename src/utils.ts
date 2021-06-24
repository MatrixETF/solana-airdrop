import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { struct, u8, nu64 } from "buffer-layout";

export const SYSTEM_PROGRAM_ID = new PublicKey(
  "11111111111111111111111111111111"
);
export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
export const MEMO_PROGRAM_ID = new PublicKey(
  "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"
);
export const RENT_PROGRAM_ID = new PublicKey(
  "SysvarRent111111111111111111111111111111111"
);
export const CLOCK_PROGRAM_ID = new PublicKey(
  "SysvarC1ock11111111111111111111111111111111"
);
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export function isValidPublicKey(key) {
  if (!key) {
    return false;
  }
  try {
    new PublicKey(key);
    return true;
  } catch {
    return false;
  }
}

export async function findProgramAddress(
  seeds: Array<Buffer | Uint8Array>,
  programId: PublicKey
) {
  const [publicKey, nonce] = await PublicKey.findProgramAddress(
    seeds,
    programId
  );
  return { publicKey, nonce };
}

export async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  tokenMintAddress: PublicKey
) {
  const { publicKey } = await findProgramAddress(
    [
      walletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return publicKey;
}

export async function createAssociatedTokenAccount(
  payer: PublicKey,
  tokenMintAddress: PublicKey,
  owner: PublicKey
) {
  const associatedTokenAddress = await findAssociatedTokenAddress(
    owner,
    tokenMintAddress
  );

  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: owner,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: tokenMintAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSTEM_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: RENT_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
  ];

  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });
}

export function transferToken({ source, dest, owner, amount }) {
  let keys = [
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: dest, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
  ];

  const layout = struct([u8("instruction"), nu64("amount")]);

  const data = Buffer.alloc(layout.span);
  layout.encode(
    {
      instruction: 3,
      amount,
    },
    data
  );

  return new TransactionInstruction({
    keys,
    data,
    programId: TOKEN_PROGRAM_ID,
  });
}
