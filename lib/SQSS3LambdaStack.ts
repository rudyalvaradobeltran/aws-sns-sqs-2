import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { EventType } from 'aws-cdk-lib/aws-s3';
import { join } from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SnsDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

export class SQSS3LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3Bucket = new s3.Bucket(this, 's3-bucket', {
      bucketName: 'example-st-s3-bucket',
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED
    });

    const snsTopic = new Topic(this, "sns-topic");

    s3Bucket.addEventNotification(EventType.OBJECT_CREATED, new SnsDestination(snsTopic));

    const sqsFailedEventQueue = new Queue(this, 'failed-sqs-event-queue', {
      retentionPeriod: cdk.Duration.minutes(5)
    });

    const sqsEventQueue = new Queue(this, 'sqs-event-queue', {
      deadLetterQueue: {
        queue: sqsFailedEventQueue,
        maxReceiveCount: 3
      }
    });
    
    snsTopic.addSubscription(new SqsSubscription(sqsEventQueue));

    const lambda = new NodejsFunction(this, 'lambda', {
      entry: (join(__dirname, '..', 'src', 'lambda', 'index.ts')),
    });

    const sqsSource = new SqsEventSource(sqsEventQueue, {
      maxConcurrency: 10,
      batchSize: 10
    });

    lambda.addToRolePolicy(new PolicyStatement({
      sid: "SQSS3BucketLambdaPermission",
      resources: [s3Bucket.arnForObjects("*")],
      effect: Effect.ALLOW,
      actions: ["s3:GetObject"]
    }));

    lambda.addEventSource(sqsSource);
  }
}
