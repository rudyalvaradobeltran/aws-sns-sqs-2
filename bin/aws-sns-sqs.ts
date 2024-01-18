#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3LambdaStack } from '../lib/S3LambdaStack';

const app = new cdk.App();
new S3LambdaStack(app, 'S3LambdaStack');
