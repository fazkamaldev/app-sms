import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ServiceName, healthCheckPaths, servicePorts, services } from "./config";

export interface AlbOutputs {
  alb: aws.lb.LoadBalancer;
  targetGroups: Record<ServiceName, aws.lb.TargetGroup>;
  url: pulumi.Output<string>;
}

export function createAlb(
  name: string,
  vpcId: pulumi.Input<string>,
  publicSubnetIds: pulumi.Input<string[]>,
  albSecurityGroupId: pulumi.Input<string>,
): AlbOutputs {
  const alb = new aws.lb.LoadBalancer(`${name}-alb`, {
    loadBalancerType: "application",
    securityGroups: [albSecurityGroupId],
    subnets: publicSubnetIds,
    tags: { Name: `${name}-alb` },
  });

  const targetGroups = {} as Record<ServiceName, aws.lb.TargetGroup>;

  for (const service of services) {
    const port = servicePorts[service];
    const healthPath = healthCheckPaths[service];

    targetGroups[service] = new aws.lb.TargetGroup(`${name}-${service}-tg`, {
      port,
      protocol: "HTTP",
      vpcId,
      targetType: "ip",
      healthCheck: {
        enabled: true,
        path: healthPath,
        matcher: "200",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      tags: { Service: service },
    });
  }

  const httpListener = new aws.lb.Listener(`${name}-http`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [
      {
        type: "redirect",
        redirect: {
          port: "80",
          protocol: "HTTP",
          statusCode: "HTTP_302",
          path: "/login",
        },
      },
    ],
  });

  const rules: { priority: number; path: string; service: ServiceName; exact?: boolean }[] = [
    { priority: 10, path: "/api/app/send-message", service: "bff-sms", exact: true },
    { priority: 20, path: "/api/auth/*", service: "bff-auth" },
    { priority: 30, path: "/api/app/*", service: "bff-app" },
    { priority: 40, path: "/login/*", service: "fe-login" },
    { priority: 50, path: "/app/*", service: "fe-app" },
  ];

  for (const rule of rules) {
    new aws.lb.ListenerRule(`${name}-rule-${rule.priority}`, {
      listenerArn: httpListener.arn,
      priority: rule.priority,
      actions: [
        {
          type: "forward",
          targetGroupArn: targetGroups[rule.service].arn,
        },
      ],
      conditions: [
        {
          pathPattern: { values: [rule.path] },
        },
      ],
    });
  }

  return {
    alb,
    targetGroups,
    url: alb.dnsName.apply((dns) => `http://${dns}`),
  };
}
