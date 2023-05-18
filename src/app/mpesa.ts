import { AccountBalanceQueryConfig, AuthResponse, B2CTransactionConfig, ClientConfig, UrlRegisterConfig } from "../interfaces";
import axios from 'axios';

export class Mpesa {
    // declare the configurations passed when creating the client
    private readonly config: ClientConfig;
    private BASE_URL: string;
    private token: string | undefined;

    constructor(configs: ClientConfig) {
        configs.environment !== "production" ? this.BASE_URL = "https://sandbox.safaricom.co.ke" : this.BASE_URL = "https://api.safaricom.co.ke"
        this.config = configs;
        axios.defaults.baseURL = this.BASE_URL
    }

    /**
     * Retrieves an access token with a set expiry date
     * @returns 
     */
    async getAccessToken(): Promise<AuthResponse> {
        const req = await axios.get(`/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { Authorization: 'Basic ' + Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString("base64")}
        })
        const { access_token } = req.data
        this.token = access_token
        return req.data;
    }

    /**
     * C2B Operations
     */

    // 1. Register confirmation and validation urls
    async registerUrls(registerParams: UrlRegisterConfig) {
        const req = await axios.post(`/mpesa/c2b/v1/registerurl`, registerParams, {
            headers: { Authorization: 'Bearer ' + this.token }
        })
        return req.data;
    }

    async B2C(b2cTransaction: B2CTransactionConfig) {
        const req = await axios.post(`/mpesa/b2c/v1/paymentrequest`, b2cTransaction, {
            headers: { Authorization: 'Bearer '+ this.token}
        })
        return req.data;
    }

    async getAccountBalance(balanceQuery: AccountBalanceQueryConfig) {
        balanceQuery.CommandID = "AccountBalance" // explicitly set this to accountbalance
        // identifier types 1 – MSISDN, 2 – Till Number, 4 – Organization short code
        balanceQuery.IdentifierType = "4"
        try {
            const req = await axios.post(`/mpesa/accountbalance/v1/query`, balanceQuery, {
                headers: { Authorization: 'Bearer ' + this.token }
            })
            if (req.status == 200) {
                return req.data;
            }
        } catch(err) {
            throw err;
        }
    }
}