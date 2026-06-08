import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
export interface VpcOutputs {
  vpc: aws.ec2.Vpc;
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;
  albSecurityGroup: aws.ec2.SecurityGroup;
  ecsSecurityGroup: aws.ec2.SecurityGroup;
  rdsSecurityGroup: aws.ec2.SecurityGroup;
  redisSecurityGroup: aws.ec2.SecurityGroup;
}

export function createVpc(name: string): VpcOutputs {
  const azs = aws.getAvailabilityZonesOutput({
    state: "available",
  });

  const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: { Name: `${name}-vpc` },
  });

  const publicSubnetA = new aws.ec2.Subnet(`${name}-public-a`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: azs.names[0],
    mapPublicIpOnLaunch: true,
    tags: { Name: `${name}-public-a` },
  });

  const publicSubnetB = new aws.ec2.Subnet(`${name}-public-b`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: azs.names[1],
    mapPublicIpOnLaunch: true,
    tags: { Name: `${name}-public-b` },
  });

  const privateSubnetA = new aws.ec2.Subnet(`${name}-private-a`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.11.0/24",
    availabilityZone: azs.names[0],
    tags: { Name: `${name}-private-a` },
  });

  const privateSubnetB = new aws.ec2.Subnet(`${name}-private-b`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.12.0/24",
    availabilityZone: azs.names[1],
    tags: { Name: `${name}-private-b` },
  });

  const internetGateway = new aws.ec2.InternetGateway(`${name}-igw`, {
    vpcId: vpc.id,
    tags: { Name: `${name}-igw` },
  });

  const publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt`, {
    vpcId: vpc.id,
    routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: internetGateway.id }],
    tags: { Name: `${name}-public-rt` },
  });

  new aws.ec2.RouteTableAssociation(`${name}-public-a-rta`, {
    subnetId: publicSubnetA.id,
    routeTableId: publicRouteTable.id,
  });

  new aws.ec2.RouteTableAssociation(`${name}-public-b-rta`, {
    subnetId: publicSubnetB.id,
    routeTableId: publicRouteTable.id,
  });

  const natEip = new aws.ec2.Eip(`${name}-nat-eip`, { domain: "vpc" });

  const natGateway = new aws.ec2.NatGateway(`${name}-nat`, {
    allocationId: natEip.id,
    subnetId: publicSubnetA.id,
    tags: { Name: `${name}-nat` },
  });

  const privateRouteTable = new aws.ec2.RouteTable(`${name}-private-rt`, {
    vpcId: vpc.id,
    routes: [{ cidrBlock: "0.0.0.0/0", natGatewayId: natGateway.id }],
    tags: { Name: `${name}-private-rt` },
  });

  new aws.ec2.RouteTableAssociation(`${name}-private-a-rta`, {
    subnetId: privateSubnetA.id,
    routeTableId: privateRouteTable.id,
  });

  new aws.ec2.RouteTableAssociation(`${name}-private-b-rta`, {
    subnetId: privateSubnetB.id,
    routeTableId: privateRouteTable.id,
  });

  const albSecurityGroup = new aws.ec2.SecurityGroup(`${name}-alb-sg`, {
    vpcId: vpc.id,
    description: "ALB ingress",
    ingress: [
      { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
      { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
    tags: { Name: `${name}-alb-sg` },
  });

  const ecsSecurityGroup = new aws.ec2.SecurityGroup(`${name}-ecs-sg`, {
    vpcId: vpc.id,
    description: "ECS tasks",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        securityGroups: [albSecurityGroup.id],
      },
      {
        protocol: "tcp",
        fromPort: 8000,
        toPort: 8000,
        securityGroups: [albSecurityGroup.id],
      },
    ],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
    tags: { Name: `${name}-ecs-sg` },
  });

  const rdsSecurityGroup = new aws.ec2.SecurityGroup(`${name}-rds-sg`, {
    vpcId: vpc.id,
    description: "RDS MySQL",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 3306,
        toPort: 3306,
        securityGroups: [ecsSecurityGroup.id],
      },
    ],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
    tags: { Name: `${name}-rds-sg` },
  });

  const redisSecurityGroup = new aws.ec2.SecurityGroup(`${name}-redis-sg`, {
    vpcId: vpc.id,
    description: "ElastiCache Redis",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 6379,
        toPort: 6379,
        securityGroups: [ecsSecurityGroup.id],
      },
    ],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
    tags: { Name: `${name}-redis-sg` },
  });

  return {
    vpc,
    publicSubnetIds: pulumi.all([publicSubnetA.id, publicSubnetB.id]),
    privateSubnetIds: pulumi.all([privateSubnetA.id, privateSubnetB.id]),
    albSecurityGroup,
    ecsSecurityGroup,
    rdsSecurityGroup,
    redisSecurityGroup,
  };
}
