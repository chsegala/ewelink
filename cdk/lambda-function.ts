import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import { execSync } from "child_process";
import { writeFileSync } from "fs";

const DIST_FOLDER = 'dist';

export interface LambdaFunctionProps extends lambda.FunctionOptions {
  srcFile: string;
  handler: string;
}

const compileFunction = (src: string, handler: string) => {
  const projectFilePath = `${DIST_FOLDER}/tsconfig.${handler}.json`;
  const config = {
    "extends": "../tsconfig.json",
    "compilerOptions": {
      "outDir": `./${handler}`,
      "rootDir": `../src/handlers/`,
    },
    "include": [`../${src}`]
  }
  writeFileSync(projectFilePath, JSON.stringify(config, null, 2));
  execSync(`yarn build --project ${projectFilePath}`);
}


export const buildLambdaFunction = (construct: cdk.Construct, id: string, props: LambdaFunctionProps): lambda.Function => {
  compileFunction(props.srcFile, props.handler);
  return new lambda.Function(construct, id, {
    ...props,
    runtime: lambda.Runtime.NODEJS_14_X,
    code: lambda.Code.fromAsset(`${DIST_FOLDER}/${props.handler}`)
  });
}