import { getAddress } from "ethers";
import { SiweMessage } from "siwe";

export const createSiweMessage = (address: string) => {
  const statement = "Sign in to the application";
  const chainId = 97;
  const domain = window.location.host;
  const origin = window.location.origin;
  const nonce = Date.now().toString();
  const params = {
    domain,
    address: getAddress(address),
    statement,
    uri: origin,
    version: "1",
    chainId,
    nonce,
  };

  const siweMessage = new SiweMessage(params);
  return siweMessage.prepareMessage();
};
