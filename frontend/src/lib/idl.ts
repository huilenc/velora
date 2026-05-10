// Anchor 0.31 IDL — struct layouts in types[], accounts[] holds name+discriminator only.
// Discriminators are placeholders; replace with `anchor build` output once deployed.
export const IDL = {
  address: "8SuWfRSyqJxpXXQ57S2hmiwKgFqpf877Gyf89yky8KhC",
  metadata: { name: "workspace", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "initializeConfig",
      discriminator: [0,0,0,0,0,0,0,0],
      accounts: [
        { name: "config", writable: true },
        { name: "authority", writable: true, signer: true },
        { name: "systemProgram" },
      ],
      args: [
        { name: "feeBps", type: "u16" },
        { name: "treasury", type: "pubkey" },
      ],
    },
    {
      name: "createPaymentLink",
      discriminator: [0,0,0,0,0,0,0,1],
      accounts: [
        { name: "config", writable: true },
        { name: "paymentLink", writable: true },
        { name: "escrowVault", writable: true },
        { name: "mint" },
        { name: "seller", writable: true, signer: true },
        { name: "tokenProgram" },
        { name: "associatedTokenProgram" },
        { name: "systemProgram" },
        { name: "rent" },
      ],
      args: [
        { name: "linkId", type: "u64" },
        { name: "amount", type: "u64" },
        { name: "description", type: "string" },
        { name: "isX402", type: "bool" },
        { name: "expiresAt", type: "i64" },
      ],
    },
    {
      name: "pay",
      discriminator: [0,0,0,0,0,0,0,2],
      accounts: [
        { name: "config", writable: true },
        { name: "paymentLink", writable: true },
        { name: "escrowVault", writable: true },
        { name: "buyerToken", writable: true },
        { name: "buyer", writable: true, signer: true },
        { name: "tokenProgram" },
      ],
      args: [],
    },
    {
      name: "settle",
      discriminator: [0,0,0,0,0,0,0,3],
      accounts: [
        { name: "config" },
        { name: "paymentLink", writable: true },
        { name: "escrowVault", writable: true },
        { name: "sellerToken", writable: true },
        { name: "treasuryToken", writable: true },
        { name: "seller", writable: true, signer: true },
        { name: "tokenProgram" },
      ],
      args: [],
    },
    {
      name: "cancelPayment",
      discriminator: [0,0,0,0,0,0,0,4],
      accounts: [
        { name: "paymentLink", writable: true },
        { name: "escrowVault", writable: true },
        { name: "buyerToken", writable: true },
        { name: "seller", writable: true, signer: true },
        { name: "tokenProgram" },
      ],
      args: [],
    },
    {
      name: "x402Verify",
      discriminator: [0,0,0,0,0,0,0,5],
      accounts: [
        { name: "paymentLink" },
        { name: "requester", signer: true },
      ],
      args: [],
    },
    {
      name: "updateConfig",
      discriminator: [0,0,0,0,0,0,0,6],
      accounts: [
        { name: "config", writable: true },
        { name: "authority", signer: true },
      ],
      args: [
        { name: "feeBps", type: { option: "u16" } },
        { name: "treasury", type: { option: "pubkey" } },
        { name: "isPaused", type: { option: "bool" } },
      ],
    },
  ],
  accounts: [
    { name: "Config",      discriminator: [0,0,0,0,0,0,0,0] },
    { name: "PaymentLink", discriminator: [0,0,0,0,0,0,0,1] },
  ],
  types: [
    {
      name: "Config",
      type: {
        kind: "struct",
        fields: [
          { name: "bump",        type: "u8"     },
          { name: "authority",   type: "pubkey" },
          { name: "isActive",    type: "bool"   },
          { name: "isPaused",    type: "bool"   },
          { name: "feeBps",      type: "u16"    },
          { name: "treasury",    type: "pubkey" },
          { name: "version",     type: "u8"     },
          { name: "totalLinks",  type: "u64"    },
          { name: "totalVolume", type: "u64"    },
        ],
      },
    },
    {
      name: "PaymentLink",
      type: {
        kind: "struct",
        fields: [
          { name: "bump",        type: "u8"     },
          { name: "seller",      type: "pubkey" },
          { name: "mint",        type: "pubkey" },
          { name: "amount",      type: "u64"    },
          { name: "description", type: "string" },
          { name: "isActive",    type: "bool"   },
          { name: "isPaid",      type: "bool"   },
          { name: "isSettled",   type: "bool"   },
          { name: "isX402",      type: "bool"   },
          { name: "createdAt",   type: "i64"    },
          { name: "linkId",      type: "u64"    },
          { name: "buyer",       type: "pubkey" },
          { name: "paidAt",      type: "i64"    },
          { name: "config",      type: "pubkey" },
          { name: "expiresAt",   type: "i64"    },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "MathOverflow",    msg: "Math overflow"              },
    { code: 6001, name: "DivisionByZero",  msg: "Division by zero"           },
    { code: 6002, name: "InsufficientFunds", msg: "Insufficient funds"       },
    { code: 6003, name: "Unauthorized",    msg: "Unauthorized"               },
    { code: 6004, name: "InactiveAccount", msg: "Account is inactive"        },
    { code: 6005, name: "ConfigInactive",  msg: "Config is inactive or paused" },
    { code: 6006, name: "InvalidAmount",   msg: "Invalid amount"             },
    { code: 6007, name: "InvalidParameter",msg: "Invalid parameter"          },
    { code: 6008, name: "InvalidFee",      msg: "Invalid fee"                },
    { code: 6009, name: "InvalidMint",     msg: "Invalid mint"               },
    { code: 6010, name: "InvalidOwner",    msg: "Invalid owner"              },
    { code: 6011, name: "AlreadyPaid",     msg: "Already paid"               },
    { code: 6012, name: "NotPaid",         msg: "Not paid yet"               },
    { code: 6013, name: "AlreadySettled",  msg: "Already settled"            },
    { code: 6014, name: "NotX402Link",     msg: "Not an x402 link"           },
    { code: 6015, name: "InvalidExpiry",   msg: "Invalid expiry timestamp"   },
    { code: 6016, name: "LinkExpired",     msg: "Payment link has expired"   },
    { code: 6017, name: "NoExpiry",        msg: "Link has no expiry set"     },
    { code: 6018, name: "NotExpiredYet",   msg: "Link has not expired yet"   },
  ],
} as const;

export type PaymentLinkAccount = {
  bump: number;
  seller: import("@solana/web3.js").PublicKey;
  mint: import("@solana/web3.js").PublicKey;
  amount: import("bn.js");
  description: string;
  isActive: boolean;
  isPaid: boolean;
  isSettled: boolean;
  isX402: boolean;
  createdAt: import("bn.js");
  linkId: import("bn.js");
  buyer: import("@solana/web3.js").PublicKey;
  paidAt: import("bn.js");
  config: import("@solana/web3.js").PublicKey;
  expiresAt: import("bn.js");
};
