import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createAlb } from "./alb";
import { dbPassword, environment, services } from "./config";
import { createDataLayer } from "./data";
import { createEcrRepos } from "./ecr";
import { createEcsCluster, createEcsServices } from "./ecs";
import { createEcsRoles } from "./iam";
import { createSmsSecrets } from "./secrets";
import { createVpc } from "./vpc";

const name = `login-${environment}`;

const vpc = createVpc(name);
const repos = createEcrRepos(name);
const roles = createEcsRoles(name);
const data = createDataLayer(
  name,
  vpc.privateSubnetIds,
  vpc.rdsSecurityGroup.id,
  vpc.redisSecurityGroup.id,
  dbPassword,
);
const alb = createAlb(name, vpc.vpc.id, vpc.publicSubnetIds, vpc.albSecurityGroup.id);
const logGroupName = `/ecs/${name}`;
const { cluster } = createEcsCluster(name, logGroupName);
const sms = createSmsSecrets(name);

new aws.iam.RolePolicy(`${name}-ecs-secrets`, {
  role: roles.executionRole.name,
  policy: sms.secret.arn.apply((secretArn) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["secretsmanager:GetSecretValue"],
          Resource: secretArn,
        },
      ],
    }),
  ),
});

createEcsServices({
  name,
  cluster,
  executionRoleArn: roles.executionRole.arn,
  taskRoleArn: roles.taskRole.arn,
  repos,
  privateSubnetIds: vpc.privateSubnetIds,
  ecsSecurityGroupId: vpc.ecsSecurityGroup.id,
  data,
  targetGroups: alb.targetGroups,
  smsSecrets: sms.ecsSecrets,
  logGroupName,
});

export const stackName = name;
export const albUrl = alb.url;
export const albDnsName = alb.alb.dnsName;
export const dbEndpoint = data.dbEndpoint;
export const redisEndpoint = data.redisEndpoint;
export const ecrRepositories = pulumi.all(
  services.map((service) => repos[service].repositoryUrl),
);
export const deployNotes = pulumi.interpolate`
Before traffic works:
1. Build and push images to ECR for each service (${services.join(", ")}).
2. Run database bootstrap: create app_db and apply mysql/init.sql (or migrations).
3. Set login:dbPassword via 'pulumi config set --secret login:dbPassword <value>'.
4. Optionally set SMS secrets: login:smsApiUser, login:smsApiPassword.
5. Open ${alb.url}/login after ECS tasks are healthy.
`;
