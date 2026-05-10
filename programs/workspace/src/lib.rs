use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount},
};

declare_id!("8SuWfRSyqJxpXXQ57S2hmiwKgFqpf877Gyf89yky8KhC");

#[program]
pub mod workspace {
    use super::*;

    // fee_bps: platform fee in basis points (250 = 2.5%, max 5000)
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        fee_bps: u16,
        treasury: Pubkey,
    ) -> Result<()> {
        require!(fee_bps <= 5000, ErrorCode::InvalidFee);
        let config = &mut ctx.accounts.config;
        config.bump = ctx.bumps.config;
        config.authority = ctx.accounts.authority.key();
        config.is_active = true;
        config.is_paused = false;
        config.fee_bps = fee_bps;
        config.treasury = treasury;
        config.version = 1;
        config.total_links = 0;
        config.total_volume = 0;
        Ok(())
    }

    // Creates a payment link PDA and its escrow vault in a single tx.
    pub fn create_payment_link(
        ctx: Context<CreatePaymentLink>,
        link_id: u64,
        amount: u64,
        description: String,
        is_x402: bool,
        expires_at: i64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(description.len() <= 200, ErrorCode::InvalidParameter);

        let now = Clock::get()?.unix_timestamp;
        if expires_at > 0 {
            require!(expires_at > now, ErrorCode::InvalidExpiry);
        }

        let config = &ctx.accounts.config;
        require!(config.is_active && !config.is_paused, ErrorCode::ConfigInactive);

        let link = &mut ctx.accounts.payment_link;
        link.bump = ctx.bumps.payment_link;
        link.seller = ctx.accounts.seller.key();
        link.mint = ctx.accounts.mint.key();
        link.amount = amount;
        link.description = description.clone();
        link.is_active = true;
        link.is_paid = false;
        link.is_settled = false;
        link.is_x402 = is_x402;
        link.created_at = now;
        link.link_id = link_id;
        link.buyer = Pubkey::default();
        link.paid_at = 0;
        link.config = ctx.accounts.config.key();
        link.expires_at = expires_at;

        let config = &mut ctx.accounts.config;
        config.total_links = config
            .total_links
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(PaymentLinkCreated {
            link_id,
            seller: ctx.accounts.seller.key(),
            amount,
            mint: ctx.accounts.mint.key(),
            is_x402,
            expires_at,
            description,
        });

        Ok(())
    }

    // Buyer deposits USDC into the escrow vault owned by the payment_link PDA.
    pub fn pay(ctx: Context<Pay>) -> Result<()> {
        let link = &ctx.accounts.payment_link;
        require!(link.is_active, ErrorCode::InactiveAccount);
        require!(!link.is_paid, ErrorCode::AlreadyPaid);

        let now = Clock::get()?.unix_timestamp;
        if link.expires_at > 0 {
            require!(now < link.expires_at, ErrorCode::LinkExpired);
        }

        let config = &ctx.accounts.config;
        require!(config.is_active && !config.is_paused, ErrorCode::ConfigInactive);

        let amount = link.amount;
        let link_id = link.link_id;
        let seller = link.seller;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.buyer_token.to_account_info(),
                    to: ctx.accounts.escrow_vault.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            amount,
        )?;

        let link = &mut ctx.accounts.payment_link;
        link.is_paid = true;
        link.buyer = ctx.accounts.buyer.key();
        link.paid_at = now;

        let config = &mut ctx.accounts.config;
        config.total_volume = config
            .total_volume
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(PaymentReceived {
            link_id,
            seller,
            buyer: ctx.accounts.buyer.key(),
            amount,
            paid_at: now,
        });

        Ok(())
    }

    // Releases escrow: seller_amount → seller, fee → treasury.
    // Called by seller (or backend using seller keypair) after payment confirmed.
    pub fn settle(ctx: Context<Settle>) -> Result<()> {
        let link = &ctx.accounts.payment_link;
        require!(link.is_paid, ErrorCode::NotPaid);
        require!(!link.is_settled, ErrorCode::AlreadySettled);
        require!(link.is_active, ErrorCode::InactiveAccount);

        if link.expires_at > 0 {
            let now = Clock::get()?.unix_timestamp;
            require!(now < link.expires_at, ErrorCode::LinkExpired);
        }

        let config = &ctx.accounts.config;
        let amount = link.amount;
        let fee = amount
            .checked_mul(config.fee_bps as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::DivisionByZero)?;
        let seller_amount = amount.checked_sub(fee).ok_or(ErrorCode::MathOverflow)?;

        // Capture values before mutable borrow
        let seller_key = ctx.accounts.seller.key();
        let link_id = link.link_id;
        let link_id_bytes = link_id.to_le_bytes();
        let bump = link.bump;
        let buyer = link.buyer;

        let bump_arr = [bump];
        let seeds = &[
            b"payment_link",
            seller_key.as_ref(),
            link_id_bytes.as_ref(),
            bump_arr.as_ref(),
        ];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.seller_token.to_account_info(),
                    authority: ctx.accounts.payment_link.to_account_info(),
                },
                signer_seeds,
            ),
            seller_amount,
        )?;

        if fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    token::Transfer {
                        from: ctx.accounts.escrow_vault.to_account_info(),
                        to: ctx.accounts.treasury_token.to_account_info(),
                        authority: ctx.accounts.payment_link.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
            )?;
        }

        let link = &mut ctx.accounts.payment_link;
        link.is_settled = true;
        link.is_active = false;

        emit!(PaymentSettled {
            link_id,
            seller: seller_key,
            buyer,
            seller_amount,
            fee,
            settled_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Seller cancels an unpaid (or paid-but-unsettled) link; refunds buyer if paid.
    pub fn cancel_payment(ctx: Context<CancelPayment>) -> Result<()> {
        let link = &ctx.accounts.payment_link;
        require!(link.is_active, ErrorCode::InactiveAccount);
        require!(!link.is_settled, ErrorCode::AlreadySettled);

        if link.is_paid {
            require!(
                link.buyer != Pubkey::default(),
                ErrorCode::InvalidParameter
            );
            let seller_key = link.seller;
            let link_id_bytes = link.link_id.to_le_bytes();
            let amount = link.amount;
            let bump_arr = [link.bump];
            let seeds = &[
                b"payment_link",
                seller_key.as_ref(),
                link_id_bytes.as_ref(),
                bump_arr.as_ref(),
            ];
            let signer_seeds: &[&[&[u8]]] = &[seeds];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    token::Transfer {
                        from: ctx.accounts.escrow_vault.to_account_info(),
                        to: ctx.accounts.buyer_token.to_account_info(),
                        authority: ctx.accounts.payment_link.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount,
            )?;
        }

        let link = &mut ctx.accounts.payment_link;
        link.is_active = false;

        Ok(())
    }

    // Buyer reclaims funds from an expired-but-unsettled paid link.
    pub fn claim_expired(ctx: Context<ClaimExpired>) -> Result<()> {
        let link = &ctx.accounts.payment_link;
        require!(link.is_active, ErrorCode::InactiveAccount);
        require!(link.is_paid, ErrorCode::NotPaid);
        require!(!link.is_settled, ErrorCode::AlreadySettled);
        require!(link.expires_at > 0, ErrorCode::NoExpiry);

        let now = Clock::get()?.unix_timestamp;
        require!(now >= link.expires_at, ErrorCode::NotExpiredYet);
        require!(
            link.buyer == ctx.accounts.buyer.key(),
            ErrorCode::Unauthorized
        );

        let seller_key = link.seller;
        let link_id_bytes = link.link_id.to_le_bytes();
        let amount = link.amount;
        let bump_arr = [link.bump];
        let seeds = &[
            b"payment_link",
            seller_key.as_ref(),
            link_id_bytes.as_ref(),
            bump_arr.as_ref(),
        ];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.buyer_token.to_account_info(),
                    authority: ctx.accounts.payment_link.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        let link = &mut ctx.accounts.payment_link;
        link.is_active = false;

        Ok(())
    }

    // Verifies x402 HTTP access: emits event if link is paid and requester is the buyer.
    pub fn x402_verify(ctx: Context<X402Verify>) -> Result<()> {
        let link = &ctx.accounts.payment_link;
        require!(link.is_x402, ErrorCode::NotX402Link);
        require!(link.is_paid, ErrorCode::NotPaid);
        require!(
            link.buyer == ctx.accounts.requester.key(),
            ErrorCode::Unauthorized
        );

        emit!(X402AccessGranted {
            link_id: link.link_id,
            requester: ctx.accounts.requester.key(),
            seller: link.seller,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        fee_bps: Option<u16>,
        treasury: Option<Pubkey>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        if let Some(fee) = fee_bps {
            require!(fee <= 5000, ErrorCode::InvalidFee);
            config.fee_bps = fee;
        }
        if let Some(t) = treasury {
            config.treasury = t;
        }
        if let Some(p) = is_paused {
            config.is_paused = p;
        }
        Ok(())
    }
}

// ── Context Structs ──────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        seeds = [b"config", authority.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + Config::LEN,
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(link_id: u64)]
pub struct CreatePaymentLink<'info> {
    #[account(
        mut,
        seeds = [b"config", seller.key().as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        seeds = [b"payment_link", seller.key().as_ref(), &link_id.to_le_bytes()],
        bump,
        payer = seller,
        space = 8 + PaymentLink::LEN,
    )]
    pub payment_link: Account<'info, PaymentLink>,
    // Escrow vault is owned by the payment_link PDA and holds USDC until settle.
    #[account(
        init,
        payer = seller,
        token::mint = mint,
        token::authority = payment_link,
        seeds = [b"escrow_vault", seller.key().as_ref(), &link_id.to_le_bytes()],
        bump,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Pay<'info> {
    #[account(
        mut,
        seeds = [b"config", payment_link.seller.as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"payment_link", payment_link.seller.as_ref(), &payment_link.link_id.to_le_bytes()],
        bump = payment_link.bump,
        constraint = payment_link.is_active @ ErrorCode::InactiveAccount,
    )]
    pub payment_link: Account<'info, PaymentLink>,
    #[account(
        mut,
        seeds = [b"escrow_vault", payment_link.seller.as_ref(), &payment_link.link_id.to_le_bytes()],
        bump,
        constraint = escrow_vault.mint == payment_link.mint @ ErrorCode::InvalidMint,
        constraint = escrow_vault.owner == payment_link.key() @ ErrorCode::InvalidOwner,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = buyer_token.mint == payment_link.mint @ ErrorCode::InvalidMint,
        constraint = buyer_token.owner == buyer.key() @ ErrorCode::InvalidOwner,
    )]
    pub buyer_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(
        seeds = [b"config", seller.key().as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [b"payment_link", seller.key().as_ref(), &payment_link.link_id.to_le_bytes()],
        bump = payment_link.bump,
        constraint = payment_link.seller == seller.key() @ ErrorCode::Unauthorized,
    )]
    pub payment_link: Account<'info, PaymentLink>,
    #[account(
        mut,
        seeds = [b"escrow_vault", seller.key().as_ref(), &payment_link.link_id.to_le_bytes()],
        bump,
        constraint = escrow_vault.mint == payment_link.mint @ ErrorCode::InvalidMint,
        constraint = escrow_vault.owner == payment_link.key() @ ErrorCode::InvalidOwner,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = seller_token.mint == payment_link.mint @ ErrorCode::InvalidMint,
    )]
    pub seller_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = treasury_token.mint == payment_link.mint @ ErrorCode::InvalidMint,
    )]
    pub treasury_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelPayment<'info> {
    #[account(
        mut,
        seeds = [b"payment_link", seller.key().as_ref(), &payment_link.link_id.to_le_bytes()],
        bump = payment_link.bump,
        constraint = payment_link.seller == seller.key() @ ErrorCode::Unauthorized,
    )]
    pub payment_link: Account<'info, PaymentLink>,
    #[account(
        mut,
        seeds = [b"escrow_vault", seller.key().as_ref(), &payment_link.link_id.to_le_bytes()],
        bump,
        constraint = escrow_vault.owner == payment_link.key() @ ErrorCode::InvalidOwner,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = buyer_token.mint == payment_link.mint @ ErrorCode::InvalidMint,
    )]
    pub buyer_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimExpired<'info> {
    #[account(
        mut,
        seeds = [b"payment_link", payment_link.seller.as_ref(), &payment_link.link_id.to_le_bytes()],
        bump = payment_link.bump,
    )]
    pub payment_link: Account<'info, PaymentLink>,
    #[account(
        mut,
        seeds = [b"escrow_vault", payment_link.seller.as_ref(), &payment_link.link_id.to_le_bytes()],
        bump,
        constraint = escrow_vault.owner == payment_link.key() @ ErrorCode::InvalidOwner,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = buyer_token.mint == payment_link.mint @ ErrorCode::InvalidMint,
        constraint = buyer_token.owner == buyer.key() @ ErrorCode::InvalidOwner,
    )]
    pub buyer_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct X402Verify<'info> {
    #[account(
        seeds = [b"payment_link", payment_link.seller.as_ref(), &payment_link.link_id.to_le_bytes()],
        bump = payment_link.bump,
    )]
    pub payment_link: Account<'info, PaymentLink>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config", authority.key().as_ref()],
        bump = config.bump,
        has_one = authority @ ErrorCode::Unauthorized,
    )]
    pub config: Account<'info, Config>,
    pub authority: Signer<'info>,
}

// ── State Accounts ───────────────────────────────────────────────────────────

#[account]
pub struct Config {
    pub bump: u8,          // 1
    pub authority: Pubkey, // 32
    pub is_active: bool,   // 1
    pub is_paused: bool,   // 1
    pub fee_bps: u16,      // 2
    pub treasury: Pubkey,  // 32
    pub version: u8,       // 1
    pub total_links: u64,  // 8
    pub total_volume: u64, // 8
}

impl Config {
    pub const LEN: usize = 1 + 32 + 1 + 1 + 2 + 32 + 1 + 8 + 8; // 86
}

#[account]
pub struct PaymentLink {
    pub bump: u8,              // 1
    pub seller: Pubkey,        // 32
    pub mint: Pubkey,          // 32
    pub amount: u64,           // 8
    pub description: String,   // 4 + 200
    pub is_active: bool,       // 1
    pub is_paid: bool,         // 1
    pub is_settled: bool,      // 1
    pub is_x402: bool,         // 1
    pub created_at: i64,       // 8
    pub link_id: u64,          // 8
    pub buyer: Pubkey,         // 32
    pub paid_at: i64,          // 8
    pub config: Pubkey,        // 32
    pub expires_at: i64,       // 8
}

impl PaymentLink {
    pub const LEN: usize = 1 + 32 + 32 + 8 + (4 + 200) + 1 + 1 + 1 + 1 + 8 + 8 + 32 + 8 + 32 + 8; // 379
}

// ── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct PaymentLinkCreated {
    pub link_id: u64,
    pub seller: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
    pub is_x402: bool,
    pub expires_at: i64,
    pub description: String,
}

#[event]
pub struct PaymentReceived {
    pub link_id: u64,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub paid_at: i64,
}

#[event]
pub struct PaymentSettled {
    pub link_id: u64,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub seller_amount: u64,
    pub fee: u64,
    pub settled_at: i64,
}

#[event]
pub struct X402AccessGranted {
    pub link_id: u64,
    pub requester: Pubkey,
    pub seller: Pubkey,
    pub timestamp: i64,
}

// ── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Division by zero")]
    DivisionByZero,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Account is inactive")]
    InactiveAccount,
    #[msg("Config is inactive or paused")]
    ConfigInactive,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid parameter")]
    InvalidParameter,
    #[msg("Invalid fee")]
    InvalidFee,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Invalid owner")]
    InvalidOwner,
    #[msg("Already paid")]
    AlreadyPaid,
    #[msg("Not paid yet")]
    NotPaid,
    #[msg("Already settled")]
    AlreadySettled,
    #[msg("Not an x402 link")]
    NotX402Link,
    #[msg("Invalid expiry timestamp")]
    InvalidExpiry,
    #[msg("Payment link has expired")]
    LinkExpired,
    #[msg("Link has no expiry set")]
    NoExpiry,
    #[msg("Link has not expired yet")]
    NotExpiredYet,
}
