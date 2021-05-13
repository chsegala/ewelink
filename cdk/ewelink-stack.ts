import * as apigateway from "@aws-cdk/aws-apigateway";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as cdk from "@aws-cdk/core";
import { Duration } from "@aws-cdk/core";
import { buildLambdaFunction } from "./lambda-function";

export class EwelinkStack extends cdk.Stack {
  private secrets_arn = "arn:aws:secretsmanager:sa-east-1:098568634478:secret:ewelink/auth-j9KhzS"

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const layers = this.getLayers();

    const functionRole = this.functionRole();
    const getLoginHandler = this.getLoginFunction(functionRole, layers);
    const listDevicesHandler = this.listDevicesFunction(functionRole, layers, getLoginHandler);
    const toggleDeviceHandler = this.toggleDeviceFunction(functionRole, layers, getLoginHandler, listDevicesHandler);

    const api = new apigateway.RestApi(this, "ewelink-api", {
      restApiName: "Ewelink Service",
      description: "This service serves Ewelink functions."
    });

    // get login
    const getLoginIntegration = new apigateway.LambdaIntegration(getLoginHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });
    api.root.addResource("login").addMethod("GET", getLoginIntegration); // GET /

    // list devices
    const listDevicesIntegration = new apigateway.LambdaIntegration(listDevicesHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });
    api.root.addMethod("GET", listDevicesIntegration); // GET /

    //toggle device
    const toggleDeviceIntegratoin = new apigateway.LambdaIntegration(toggleDeviceHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });
    api.root.addMethod("PUT", toggleDeviceIntegratoin); // GET /

  }

  private getBucket(): s3.IBucket {
    return new s3.Bucket(this, 'EwelinkFunctionBucket');
  }

  private functionRole() {
    const role = new iam.Role(this, 'LambdaFunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    role.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AWSLambdaBasicExecutionRole', 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'));
    role.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AWSLambdaRole', 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole'))

    return role;
  }

  private getLayers() {
    return [new lambda.LayerVersion(this, 'EwelinkRuntimerLayer', {
      code: lambda.Code.fromAsset('dist/layers/'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      license: 'Apache-2.0',
      description: 'eWelink runtime dependencies',
    })]
  }

  private getLoginFunction(role: iam.Role, layers: lambda.LayerVersion[]) {
    const secrets = sm.Secret.fromSecretAttributes(this, 'EwelinkSecret', {
      secretCompleteArn: this.secrets_arn
    });

    return buildLambdaFunction(this, "GetLoginFunction", {
      srcFile: 'src/handlers/getLogin.ts',
      handler: "getLogin.handler",
      timeout: Duration.seconds(5),
      role: role,
      layers: layers,
      environment: {
        USERNAME: secrets.secretValueFromJson('username').toString(),
        PASSWORD: secrets.secretValueFromJson('password').toString()
      }
    })
  }

  private listDevicesFunction(role: iam.Role, layers: lambda.LayerVersion[], getLoginFunction: lambda.Function) {

    return buildLambdaFunction(this, "ListDevicesFunction", {
      srcFile: 'src/handlers/listDevices.ts',
      handler: "listDevices.handler",
      timeout: Duration.seconds(10),
      role: role,
      layers: layers,
      environment: {
        GET_LOGIN_FUNCTION: getLoginFunction.functionArn
      }
    })
  }

  private toggleDeviceFunction(role: iam.Role, layers: lambda.LayerVersion[], getLoginFunction: lambda.Function, listDevicesFunction: lambda.Function) {

    return buildLambdaFunction(this, "ToggleDeviceFunction", {
      srcFile: 'src/handlers/toggleDevice.ts',
      handler: "toggleDevice.handler",
      timeout: Duration.seconds(30),
      role: role,
      layers: layers,
      environment: {
        GET_LOGIN_FUNCTION: getLoginFunction.functionArn,
        LIST_DEVICES_FUNCTION: listDevicesFunction.functionArn,
        EXCLUDED_DEVICES: ''
      }
    })
  }
}