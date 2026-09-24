import { Polar } from "@polar-sh/sdk";

type PolarServer = "sandbox" | "production";

function getRequiredEnvVar(name: string) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export function getPolarAccessToken(){
    return getRequiredEnvVar("POLAR_ACCESS_TOKEN");
}

export function getPolarProductId(){
    return getRequiredEnvVar("POLAR_PRODUCT_ID");
}

export function getPolarCreditsMeterId(){
    return getRequiredEnvVar("POLAR_CREDITS_METER_ID");
}

export function getPolarServer(): PolarServer {
    const server = process.env.POLAR_SERVER;
    if(!server){
        return "sandbox";
    }

    if(server !== "sandbox" && server !== "production"){
        throw new Error(`Invalid POLAR_SERVER value: ${server}. Must be "sandbox" or "production".`);
    }

    return server;
}

const polar = new Polar({
    accessToken: getPolarAccessToken(),
    server: getPolarServer(),
});

function hasStatusCode(error: unknown): error is { statusCode: number } {
    return (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        typeof (error as any).statusCode === "number"
    )
}

type CreateCheckoutUrlParams = {
    customerExternalId: string;
    requestUrl: string;
}

export async function createCheckoutUrl({
    customerExternalId,
    requestUrl,
}: CreateCheckoutUrlParams){
    const result = await polar.checkouts.create({
        products: [getPolarProductId()],
        successUrl: new URL("/billing/success", requestUrl).toString(),
        externalCustomerId: customerExternalId,
        metadata: { source: "cleocode-cli" },
    })

    return result.url;
}

export async function createCustomerPortalUrl({
    customerExternalId,
    requestUrl,
}: CreateCheckoutUrlParams){
    const result = await polar.customerSessions.create({
        externalCustomerId: customerExternalId,
        returnUrl: new URL("/billing/success", requestUrl).toString(),
    })

    return result.customerPortalUrl;
};

export async function getAvailableCreditsBalance(customerExternalId: string){
    try{
        const customerState = await polar.customers.getStateExternal({
            externalId: customerExternalId,
        });
        const matchingMeter = customerState.activeMeters.filter(
            (meter) => meter.meterId === getPolarCreditsMeterId(),
        );

        if(matchingMeter.length > 1){
            throw new Error("Expected exactly one matching Polar credit meter");
        }

        const creditMeter = matchingMeter[0];

        return creditMeter?.balance ?? 0;

    } catch (error) {
        if (hasStatusCode(error) && error.statusCode === 404) {
            return 0;
        }

        throw error;
    }
}

type IngestAiUsageParams = {
    externalCustomerId: string;
    eventId: string;
    credits: number;
}

export async function ingestAiUsage({ 
    externalCustomerId, 
    eventId, 
    credits }: IngestAiUsageParams){
    if (credits <= 0) {
        return;
    }

    await polar.events.ingest({
        events:[
            {
                name: "cleocode_usage",
                externalId: eventId,
                externalCustomerId,
                metadata: { credits },
            },
        ],
    });
};