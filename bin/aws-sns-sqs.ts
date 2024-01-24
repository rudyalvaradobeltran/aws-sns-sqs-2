#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SQSS3LambdaStack } from '../lib/SQSS3LambdaStack';

const app = new cdk.App();
new SQSS3LambdaStack(app, 'SQSS3LambdaStack');
