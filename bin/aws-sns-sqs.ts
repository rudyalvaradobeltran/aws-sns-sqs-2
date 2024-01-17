#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BatchS3LambdaStack } from '../lib/batchS3LambdaStack';

const app = new cdk.App();
new BatchS3LambdaStack(app, 'BatchS3LambdaStack');
