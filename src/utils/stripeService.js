import Stripe from "stripe";
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export const createConnectedAccount = async (businessEmail, businessName) => {
    const account = await stripe.accounts.create({
        type: "express",
        email: businessEmail,
        business_type: "company",
        company: { name: businessName },
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
        }
    })
    return account;
}

export const createAccountLink = async (accountId) => {
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.FRONTEND_URL}/business/reauth`,
        return_url: `${process.env.FRONTEND_URL}/business/dashboard`,
        type: "account_onboarding"
    })
    return accountLink.url
}

export const createLoginLink = async (accountId) => {
    const loginLink = await stripe.accounts.createLoginLink(accountId)
    return loginLink.url
}