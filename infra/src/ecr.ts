import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ServiceName, services } from "./config";

export function createEcrRepos(name: string): Record<ServiceName, aws.ecr.Repository> {
  const repos = {} as Record<ServiceName, aws.ecr.Repository>;

  for (const service of services) {
    repos[service] = new aws.ecr.Repository(`${name}-${service}`, {
      name: `${name}/${service}`,
      imageScanningConfiguration: { scanOnPush: true },
      forceDelete: true,
      tags: { Service: service },
    });
  }

  return repos;
}

export function imageUri(
  repo: aws.ecr.Repository,
  tag: pulumi.Input<string>,
): pulumi.Output<string> {
  return pulumi.all([repo.repositoryUrl, tag]).apply(([url, imageTag]) => `${url}:${imageTag}`);
}
