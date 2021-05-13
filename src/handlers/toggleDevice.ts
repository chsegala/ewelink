import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import eWelink, { Device } from "ewelink-api";
import "source-map-support/register";
import { getEwelinkAuthConnection } from "./utils/getEwelinkAuthConnection";
import { parseLambdaBlob, remoteLambdaCall } from "./utils/remoteLambdaCall";

export interface DesiredState {
  state: "on" | "off",
  deviceName?: string;
}

export interface ReturnState extends DesiredState {
  deviceid?: string;
  message?: string;
}

const getDevices = async (): Promise<Device[]> => {
  const lambdaName = process.env["LIST_DEVICES_FUNCTION"] ?? '';
  const lambdaResult = await remoteLambdaCall(lambdaName);
  return parseLambdaBlob(lambdaResult);
}

const toggleState = async (d: Device, state: DesiredState, connection: eWelink): Promise<ReturnState> => {
  try {
    console.info('Turning ', d.deviceid, ' ', state.state);
    const newState = await connection.setDevicePowerState(d.deviceid, state.state)
    return { ...newState, deviceid: d.deviceid, state: state.state }
  } catch (e) {
    return {
      deviceid: d.deviceid,
      message: e.message
    } as ReturnState
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // All log statements are written to CloudWatch
  console.debug("Received event:", event);
  const excludeDevices = (process.env['EXCLUDED_DEVICES'] ?? '').split('');
  let body: DesiredState = { state: "off" };

  if (!!event.body) {
    body = JSON.parse(event?.body);
  }

  const connection = await getEwelinkAuthConnection();

  const newStates = await Promise.all((await getDevices())
    .filter(d => !excludeDevices.includes(d.name))
    .filter(d => !!body.deviceName && d.name == body.deviceName)
    .map(d => toggleState(d, body, connection)));

  return {
    statusCode: 200,
    body: JSON.stringify(newStates),
  };
};
