import { Lambda } from "aws-sdk";

export const remoteLambdaCall = async (lambdaName: string, props?: object): Promise<undefined | Lambda._Blob> => {
  const lambda = new Lambda();

  console.log("calling lambda", lambdaName);
  const response = lambda
    .invoke({
      FunctionName: lambdaName ?? "",
      Payload: JSON.stringify(props)
    })
    .promise();

  return (await response).Payload
}

export const parseLambdaBlob = async <T>(payload?: Lambda._Blob): Promise<T> => {
  let payloadStr = JSON.parse(payload as string);
  payloadStr = JSON.parse(payloadStr?.body);

  if (!payloadStr) {
    throw new Error('Unable to parse lambda result');
  }

  return payloadStr;
}