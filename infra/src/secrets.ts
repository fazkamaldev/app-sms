import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config("login");

export function createSmsSecrets(name: string) {
  const smsApiUser = config.getSecret("smsApiUser");
  const smsApiPassword = config.getSecret("smsApiPassword");
  const smsApiUrl =
    config.get("smsApiUrl") ?? "https://api.mobilemessage.com.au/v1/messages";
  const smsSender = config.get("smsSender") ?? "";

  const secret = new aws.secretsmanager.Secret(`${name}-sms`, {
    name: `${name}/sms`,
    description: "SMS API credentials for bff-sms",
  });

  new aws.secretsmanager.SecretVersion(`${name}-sms-version`, {
    secretId: secret.id,
    secretString: pulumi
      .all([smsApiUser, smsApiPassword])
      .apply(([user, password]) =>
        JSON.stringify({
          SMS_API_URL: smsApiUrl,
          SMS_API_USER: user ?? "",
          SMS_API_PASSWORD: password ?? "",
          SMS_SENDER: smsSender,
        }),
      ),
  });

  const ecsSecrets = secret.arn.apply((secretArn) => [
    { name: "SMS_API_URL", valueFrom: `${secretArn}:SMS_API_URL::` },
    { name: "SMS_API_USER", valueFrom: `${secretArn}:SMS_API_USER::` },
    { name: "SMS_API_PASSWORD", valueFrom: `${secretArn}:SMS_API_PASSWORD::` },
    { name: "SMS_SENDER", valueFrom: `${secretArn}:SMS_SENDER::` },
  ]);

  return { secret, ecsSecrets };
}
