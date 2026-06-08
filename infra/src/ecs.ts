import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {
  ServiceName,
  cookieSecure,
  healthCheckPaths,
  imageTag,
  servicePorts,
  services,
} from "./config";
import { imageUri } from "./ecr";
import { DataOutputs } from "./data";

export interface EcsInputs {
  name: string;
  cluster: aws.ecs.Cluster;
  executionRoleArn: pulumi.Input<string>;
  taskRoleArn: pulumi.Input<string>;
  repos: Record<ServiceName, aws.ecr.Repository>;
  privateSubnetIds: pulumi.Input<string[]>;
  ecsSecurityGroupId: pulumi.Input<string>;
  data: DataOutputs;
  targetGroups: Record<ServiceName, aws.lb.TargetGroup>;
  smsSecrets?: pulumi.Input<{ name: string; valueFrom: string }[]>;
}

export function createEcsCluster(name: string, logGroupName: string) {
  const logGroup = new aws.cloudwatch.LogGroup(`${name}-ecs-logs`, {
    name: logGroupName,
    retentionInDays: 14,
    tags: { Name: logGroupName },
  });

  const cluster = new aws.ecs.Cluster(`${name}-cluster`, {
    settings: [{ name: "containerInsights", value: "enabled" }],
    tags: { Name: `${name}-cluster` },
  });

  return { cluster, logGroup };
}

function envVar(name: string, value: pulumi.Input<string>) {
  return { name, value };
}

function secretVar(name: string, valueFrom: pulumi.Input<string>) {
  return { name, valueFrom };
}

export function createEcsServices(inputs: EcsInputs & { logGroupName: string }) {
  const {
    name,
    cluster,
    executionRoleArn,
    taskRoleArn,
    repos,
    privateSubnetIds,
    ecsSecurityGroupId,
    data,
    targetGroups,
    smsSecrets = [],
    logGroupName,
  } = inputs;

  const taskDefinitions: Record<ServiceName, aws.ecs.TaskDefinition> = {} as Record<
    ServiceName,
    aws.ecs.TaskDefinition
  >;
  const ecsServices: Record<ServiceName, aws.ecs.Service> = {} as Record<
    ServiceName,
    aws.ecs.Service
  >;

  for (const service of services) {
    const port = servicePorts[service];
    const image = imageUri(repos[service], imageTag);

    const environment =
      service === "bff-auth"
        ? [
            envVar("DATABASE_URL", data.databaseUrlAuth),
            envVar("REDIS_URL", data.redisUrl),
            envVar("SESSION_COOKIE_NAME", "session_id"),
            envVar("SESSION_TTL_SECONDS", "3600"),
            envVar("COOKIE_SECURE", cookieSecure),
            envVar("SEED_ADMIN", "false"),
          ]
        : service === "bff-app"
          ? [
              envVar("DATABASE_URL", data.databaseUrlApp),
              envVar("REDIS_URL", data.redisUrl),
              envVar("SESSION_COOKIE_NAME", "session_id"),
            ]
          : service === "bff-sms"
            ? [
                envVar("REDIS_URL", data.redisUrl),
                envVar("SESSION_COOKIE_NAME", "session_id"),
              ]
            : [];

    const secrets = service === "bff-sms" ? smsSecrets : [];

    taskDefinitions[service] = new aws.ecs.TaskDefinition(`${name}-${service}-task`, {
      family: `${name}-${service}`,
      cpu: "256",
      memory: "512",
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn,
      taskRoleArn,
      containerDefinitions: pulumi
        .all([image, environment, secrets])
        .apply(([imageUrl, env, secretEnv]) =>
          JSON.stringify([
            {
              name: service,
              image: imageUrl,
              essential: true,
              portMappings: [{ containerPort: port, protocol: "tcp" }],
              environment: env,
              secrets: secretEnv,
              logConfiguration: {
                logDriver: "awslogs",
                options: {
                  "awslogs-group": logGroupName,
                  "awslogs-region": aws.config.region,
                  "awslogs-stream-prefix": service,
                },
              },
            },
          ]),
        ),
      tags: { Service: service },
    });

    ecsServices[service] = new aws.ecs.Service(`${name}-${service}`, {
      cluster: cluster.arn,
      taskDefinition: taskDefinitions[service].arn,
      desiredCount: 1,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: privateSubnetIds,
        securityGroups: [ecsSecurityGroupId],
        assignPublicIp: false,
      },
      loadBalancers: [
        {
          targetGroupArn: targetGroups[service].arn,
          containerName: service,
          containerPort: port,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
      tags: { Service: service },
    });
  }

  return { taskDefinitions, ecsServices };
}
