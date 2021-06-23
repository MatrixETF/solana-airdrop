import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { struct, u8, nu64 } from "buffer-layout";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
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
