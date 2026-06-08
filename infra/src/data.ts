import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { environment } from "./config";

export interface DataOutputs {
  dbEndpoint: pulumi.Output<string>;
  redisEndpoint: pulumi.Output<string>;
  databaseUrlAuth: pulumi.Output<string>;
  databaseUrlApp: pulumi.Output<string>;
  redisUrl: pulumi.Output<string>;
}

export function createDataLayer(
  name: string,
  privateSubnetIds: pulumi.Input<string[]>,
  rdsSecurityGroupId: pulumi.Input<string>,
  redisSecurityGroupId: pulumi.Input<string>,
  dbPassword: pulumi.Input<string>,
): DataOutputs {
  const dbSubnetGroup = new aws.rds.SubnetGroup(`${name}-db-subnets`, {
    subnetIds: privateSubnetIds,
    tags: { Name: `${name}-db-subnets` },
  });

  const db = new aws.rds.Instance(`${name}-mysql`, {
    engine: "mysql",
    engineVersion: "8.0",
    instanceClass: environment === "prod" ? "db.t3.small" : "db.t3.micro",
    allocatedStorage: 20,
    dbName: "auth_db",
    username: "loginadmin",
    password: dbPassword,
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [rdsSecurityGroupId],
    skipFinalSnapshot: environment !== "prod",
    publiclyAccessible: false,
    backupRetentionPeriod: environment === "prod" ? 7 : 1,
    tags: { Name: `${name}-mysql` },
  });

  const redisSubnetGroup = new aws.elasticache.SubnetGroup(`${name}-redis-subnets`, {
    subnetIds: privateSubnetIds,
    tags: { Name: `${name}-redis-subnets` },
  });

  const redis = new aws.elasticache.Cluster(`${name}-redis`, {
    engine: "redis",
    engineVersion: "7.1",
    nodeType: environment === "prod" ? "cache.t3.small" : "cache.t3.micro",
    numCacheNodes: 1,
    subnetGroupName: redisSubnetGroup.name,
    securityGroupIds: [redisSecurityGroupId],
    tags: { Name: `${name}-redis` },
  });

  const databaseUrlAuth = pulumi
    .all([db.endpoint, db.username, dbPassword])
    .apply(
      ([endpoint, username, password]) =>
        `mysql+pymysql://${username}:${password}@${endpoint}/auth_db`,
    );

  const databaseUrlApp = pulumi
    .all([db.endpoint, db.username, dbPassword])
    .apply(
      ([endpoint, username, password]) =>
        `mysql+pymysql://${username}:${password}@${endpoint}/app_db`,
    );

  const redisUrl = redis.cacheNodes.apply(
    (nodes) => `redis://${nodes[0].address}:${nodes[0].port}/0`,
  );

  return {
    dbEndpoint: db.endpoint,
    redisEndpoint: redis.cacheNodes.apply((nodes) => nodes[0].address),
    databaseUrlAuth,
    databaseUrlApp,
    redisUrl,
  };
}
