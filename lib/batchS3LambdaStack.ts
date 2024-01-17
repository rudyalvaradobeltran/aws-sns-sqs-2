import * as cdk from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
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

export class BatchS3LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3Bucket = new Bucket(this, 'batch-s3-bucket', {
      bucketName: 'batch-s3-bucket',
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const snsTopic = new Topic(this, "batch-sns-topic");

    s3Bucket.addEventNotification(EventType.OBJECT_CREATED, new SnsDestination(snsTopic));

    const sqsFailedEventQueue = new Queue(this, 'batch-failed-sqs-event-queue', {
      retentionPeriod: cdk.Duration.minutes(5)
    });

    const sqsEventQueue = new Queue(this, 'batch-sqs-event-queue', {
      deadLetterQueue: {
        queue: sqsFailedEventQueue,
        maxReceiveCount: 3
      }
    });
    
    snsTopic.addSubscription(new SqsSubscription(sqsEventQueue));

    const lambda = new NodejsFunction(this, 'batch-lambda', {
      entry: (join(__dirname, '..', 'src', 'batch-lambda', 'index.ts')),
    });

    const sqsSource = new SqsEventSource(sqsEventQueue, {
      maxConcurrency: 10,
      batchSize: 10
    });

    lambda.addToRolePolicy(new PolicyStatement({
      sid: "batchS3BucketLambdaPermission",
      resources: [s3Bucket.arnForObjects("*")],
      effect: Effect.ALLOW,
      actions: ["s3:GetObject"]
    }));

    lambda.addEventSource(sqsSource);
  }
}
