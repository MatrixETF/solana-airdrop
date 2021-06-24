import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";



import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Cluster,
  Account,
  Transaction,
} from "@solana/web3.js";
import {
  isValidPublicKey,
  transferToken,
  findAssociatedTokenAddress,
} from "./utils";

// initialize configuration
dotenv.config();

const app: Application = express();
app.options('*', cors());
app.use(express.json());

const port = process.env.PORT;
const network = process.env.NETWORK as Cluster;
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error("Not set PRIVATE_KEY");
}

const SUPPORTED = ["SOL", "BTC", "ETH", "WSOL"];

const COINS = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
  },
  WSOL: {
    symbol: "WSOL",
    name: "Wrapped Solana",
    mint: "8RyDQRkxSNkxSrrCSJVu3ictHZsQX7KikpcHFjdCTRZc",
    decimals: 9,
  },
  BTC: {
    symbol: "BTC",
    name: "Wrapped Bitcoin",
    mint: "Amp5SCa8MaC8bPAqbCbAwoT4RjXtX6baLoqBQQZQuVSv",
    decimals: 6,
  },
  ETH: {
    symbol: "ETH",
    name: "Wrapped Ethereum",
    mint: "3FFTeEfJXaLauvywf5rc8Q3vmdnVrbRkMdKyxs1eVZ3M",
    decimals: 6,
  },
};

const connection = new Connection(clusterApiUrl(network));
const ACCOUNT = new Account(privateKey.split(",").map((k) => parseInt(k)));
const OWNER = ACCOUNT.publicKey;



app.use('', express.static('./'));

app.get("/", async (req: Request, res: Response) => {
  res.json({ success: true, data: `MatrixETF ${network} Airdrop API` });
});

app.post("/", async (req: Request, res: Response) => {
  const { address, coin } = req.body;

  if (!address || !coin) {
    res.status(400).json({ success: false, message: "Parameter Required" });
    return;
  }

  if (!isValidPublicKey(address)) {
    res.status(400).json({ success: false, message: "Invalid address" });
    return;
  }

  if (!SUPPORTED.includes(coin)) {
    res.status(400).json({ success: false, message: "Coin not supported" });
    return;
  }

  if (coin === "SOL") {
    const txid = await connection.requestAirdrop(
      new PublicKey(address),
      1 * 10 ** COINS[coin].decimals
    );
    res.json({ success: true, txid });
  } else {
    const { mint, decimals } = COINS[coin];

    const source = await findAssociatedTokenAddress(OWNER, new PublicKey(mint));

    let destination = new PublicKey(address);
    const { data } = await connection.getAccountInfo(new PublicKey(address));
    if (data.length === 0) {
      destination = await findAssociatedTokenAddress(
        new PublicKey(address),
        new PublicKey(mint)
      );
    }

    const recentBlockhash = await connection.getRecentBlockhash();

    const transaction = new Transaction({
      recentBlockhash: recentBlockhash.blockhash,
    }).add(
      transferToken({
        source,
        dest: destination,
        amount: 1 * 10 ** decimals,
        owner: OWNER,
      })
    );
    transaction.sign(ACCOUNT);

    try {
      const txid = await connection.sendTransaction(transaction, [ACCOUNT], {
        skipPreflight: false,
      });
      res.json({ success: true, txid });
      return;
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
  }
});

app.listen(port, function () {
  console.log(`App is listening on port: ${port}`);
  console.log(`Running Solana: ${network}`);
  console.log(`Using account: ${OWNER.toBase58()}`);
});
