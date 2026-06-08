import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config("login");
const awsConfig = new pulumi.Config("aws");

export const environment = config.get("environment") ?? "dev";
export const region = awsConfig.require("region");
export const imageTag = config.get("imageTag") ?? "latest";
export const domainName = config.get("domainName") ?? "";
export const cookieSecure = config.get("cookieSecure") ?? "true";
export const dbPassword = config.requireSecret("dbPassword");

export const services = [
  "fe-login",
  "fe-app",
  "bff-auth",
  "bff-app",
  "bff-sms",
] as const;

export type ServiceName = (typeof services)[number];

export const servicePorts: Record<ServiceName, number> = {
  "fe-login": 80,
  "fe-app": 80,
  "bff-auth": 8000,
  "bff-app": 8000,
  "bff-sms": 8000,
};

export const healthCheckPaths: Record<ServiceName, string> = {
  "fe-login": "/",
  "fe-app": "/",
  "bff-auth": "/api/auth/health",
  "bff-app": "/api/app/health",
  "bff-sms": "/api/app/health",
};
