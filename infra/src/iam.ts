import * as aws from "@pulumi/aws";

export function createEcsRoles(name: string) {
  const executionRole = new aws.iam.Role(`${name}-ecs-execution`, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
        },
      ],
    }),
  });

  new aws.iam.RolePolicyAttachment(`${name}-ecs-execution-policy`, {
    role: executionRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  });

  const taskRole = new aws.iam.Role(`${name}-ecs-task`, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
        },
      ],
    }),
  });

  return { executionRole, taskRole };
}
