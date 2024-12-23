import axios from "axios";
import BigNumber from "bignumber.js";
import ProxyAdmin from "../contexts/contract-abis/ProxyAdmin.json";

const Web3 = require('web3');
const web3 = new Web3();
const { toBuffer, bufferToHex, ecrecover, publicToAddress, hashPersonalMessage, fromRpcSig } = require('ethereumjs-util');


export const isValidAddress = (address: string): boolean => {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};

export const getFunctionSelector = (signature: string): string => {
  return web3.utils.sha3(signature).slice(0, 10);
};

export const extractFunctionSelectorFromCalldata = (calldata: string): string => {
  return calldata.slice(0, 10);
}

export const extractValueFromCalldata = (calldata: string): string => {
  const encodedValue = calldata.slice(10, 74);
  
  // Decode the value as a uint256
  const value = web3.utils.hexToNumberString(`0x${encodedValue}`);
  
  return value;
};

export const getAbiWithContractAddress = (contractsManager: any, contractAddress: string): any[] => {
  try {
    const contracts = Object.keys(contractsManager);
    const contractName = contracts.find((contract: any) => contractsManager[contract].options?.address === contractAddress);
    if (contractName) {
      return contractsManager[contractName].options.jsonInterface;
    }
    return [];
  } catch (error) {
    console.error("Error fetching contract ABI:", error);
    return [];
  }
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatFunctionName(functionString: string): string {
  // Remove parameters like `(uint256)`
  let formatted = functionString.replace(/\(.*\)/, "");

  formatted = formatted.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

  // Capitalize the first letter and add "Set" at the start
  return capitalizeFirstLetter(formatted);
}

export const getParameterDescription = (parameterName: string): string => {
  if (parameterName === "setCreateProposalFee") {
    return "Fee required to create a governance proposal.";
  } else if (parameterName === "setDelegatorMinStake") {
    return "Minimum stake required for a delegator to participate.";
  } else if (parameterName === "setMinimumGasPrice") {
    return "The lowest gas price allowed for transactions.";
  } else if (parameterName === "setBlockGasLimit") {
    return "Maximum gas allowed per block.";
  } else if (parameterName === "setGovernancePotShareNominator") {
    return "The portion of the governance pot allocated to rewards.";
  } else if (parameterName === "setReportDisallowPeriod") {
    return "Timeframe during which a node announces maintenance to avoid penalties.";
  }
  return "";
}

export const getFunctionInfoWithAbi = (contractsManager: any, contractAddress: string, calldata: string) => {
  const selector = extractFunctionSelectorFromCalldata(calldata);
  const abi = getAbiWithContractAddress(contractsManager, contractAddress);
  const matchingFunction = abi.find(item => {
      if (item.type === 'function') {
        const functionSignature = `${item.name}(${item.inputs.map((input: any) => input.type).join(',')})`;
        const calculatedSelector = web3.utils.sha3(functionSignature).slice(0, 10);
        return calculatedSelector === selector;
      }
      return false;
  });
  return {parameterName: formatFunctionName(matchingFunction ? `${matchingFunction.name}(${matchingFunction.inputs.map((input: any) => input.type).join(',')})` : 'Unknown function'), parameterDescription: getParameterDescription(matchingFunction ? matchingFunction.name : '')};
};

export const getFunctionNameFromDirectory = async (selector: string): Promise<string | null> => {
  try {
    const response = await axios.get(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`);
    const results = response.data.results;
    
    if (results.length > 0) {
      return results[0].text_signature; // Returns the first matching function name
    }
  } catch (error) {
    console.error("Error fetching function name:", error);
  }
  return null; // Returns null if no match found
};

export const extractTargetAddressFromCalldata = (calldata: string): string => {
  // Assuming the address is the first parameter after the function selector (first 4 bytes)
  const encodedAddress = calldata.slice(10, 74); // Next 32 bytes after the selector

  // Convert to standard 20-byte address format
  const address = `0x${encodedAddress.slice(24)}`; // Take the last 40 hex characters

  return address;
};

export const getCoreContractByAddress = (contractsManager: any, contractAddresses: Array<string>): any => {
  const contracts = Object.values(contractsManager);
  
  return contractAddresses
    .map((contractAddress) =>
      contracts.find((contract: any) => contract.options?.address.toLowerCase() === contractAddress.toLowerCase())
    )
    .find((contract) => contract !== undefined) || null;
};

export const getMatchingFunction = (selector: string, abis: Array<any>) => {
  for (const abi of abis) {
    const matchingFunction = abi.find((item: any) => {
      if (item.type === 'function') {
        const functionSignature = `${item.name}(${item.inputs.map((input: any) => input.type).join(',')})`;
        const calculatedSelector = web3.utils.sha3(functionSignature).slice(0, 10);
        if (calculatedSelector === selector) {
          // Stop processing further once a match is found
          return true;
        }
      }
      return false;
    });
  
    // If a matching function is found, break the loop
    if (matchingFunction) {
      return matchingFunction;
    }
  }
}

export const decodeCallData = (contractsManager: any, contractAddress: any, calldata: string) => {
  const extractedTargetContractAddress = extractTargetAddressFromCalldata(calldata);
  const contract = getCoreContractByAddress(contractsManager, [contractAddress, extractedTargetContractAddress]);
  let selector = extractFunctionSelectorFromCalldata(calldata);
  if (selector == '0x00000000') selector = getFunctionSelector(calldata);
  const matchingFunction = getMatchingFunction(selector, [ProxyAdmin.abi, contract.options.jsonInterface]);
  if (!matchingFunction) return {};
  const decodedData = web3.eth.abi.decodeParameters(matchingFunction.inputs, calldata.slice(10));
  
  const length = decodedData.__length__;
  const filteredObj = Object.fromEntries(
    Object.entries(decodedData)
      .filter(([key, value]) => key !== '__length__' && (isNaN(Number(key)) || Number(key) >= length))
  );

  return {"Function Name": matchingFunction.name, ...filteredObj};
}

export const timestampToDate = (timestamp: string) => {
  const date = new Date(Number(timestamp) * 1000);
  const month = date.toLocaleString('en-US', { month: 'short' }); // Get short month name
  const day = date.getDate();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export const timestampToDateTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const month = date.toLocaleString('en-US', { month: 'short' }); // Get short month name
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Get hours, minutes, and seconds and pad with leading zeros if needed
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}

export const getAddressFromPublicKey = (publicKey: string): string => {
  let publicKeyCleaned = publicKey;

  if (publicKey.startsWith("0x")) {
    publicKeyCleaned = publicKey.substring(2);
  }

  const resultBuffer = publicToAddress(
    Buffer.from(publicKeyCleaned, "hex"),
    true
  );

  return `0x${resultBuffer.toString("hex")}`;
}

export const requestPublicKeyMetamask = async (web3: any, address: string) => {
  // Sign a message
  const message = 'MetaMask public key retrieval';
  const messageHex = bufferToHex(Buffer.from(message, 'utf8'));
  const signature = await web3.eth.personal.sign(message, address);

  // Hash the message
  const messageHash = hashPersonalMessage(toBuffer(messageHex));

  // Extract signature parameters
  const { v, r, s } = fromRpcSig(signature);

  // Recover the public key
  const publicKey = ecrecover(messageHash, v, r, s);
  const publicKeyHex = bufferToHex(publicKey);
  const derivedAddress = bufferToHex(publicToAddress(publicKey));

  console.log(`Address: ${address}`);
  console.log(`Derived Address: ${derivedAddress}`);
  console.log(`Public Key: ${publicKeyHex}`);

  return publicKeyHex;
}

/**
 * Determines the number of decimal places to interpret the value as.
 * Assumes different units based on the length of the value.
 * @param {string|number} value - The value to check.
 * @returns {number} - The number of decimal places.
 */
export const getDecimalsBasedOnUnitLength = (value: string | number): number => {
  // Convert to string if it's a number
  if (typeof value === 'number') {
    value = value.toString();
  }

  // Remove any leading zeros
  value = value.replace(/^0+/, '');

  const strLength = value.length;

  // Interpret based on the number of trailing zeros
  if (strLength >= 18) {
    return 18;
  } else if (strLength >= 9) {
    return 9;
  } else {
    return 1;
  }
}

/**
 * Determines the unit name based on the length of the value.
 * Assumes different units like Wei, Gwei, and DMD.
 * @param {string|number} value - The value to check.
 * @returns {string} - The unit name (Wei, Gwei, or DMD).
 */
export const getCryptoUnitName = (value: string | number): string => {
  // Convert to string if it's a number
  if (typeof value === 'number') {
    value = value.toString();
  }

  // Remove any leading zeros
  value = value.replace(/^0+/, '');

  const strLength = value.length;

  // Interpret based on the number of trailing zeros
  if (strLength >= 18) {
    return "DMD";
  } else if (strLength >= 9) {
    return "Gwei";
  } else {
    return "Wei";
  }
}

/**
 * Converts a value to its corresponding unit and returns a string representation.
 * Assumes different units based on the length of the value and formats it accordingly.
 * @param {string|number} value - The value to convert.
 * @returns {string} - The value formatted with its unit (Wei, Gwei, or DMD).
 */
export const formatCryptoUnitValue = (value: string | number): string => {
  // Convert to string if it's a number
  if (typeof value === 'number') {
    value = value.toString();
  }

  // Remove any leading zeros
  value = value.replace(/^0+/, '');

  const strLength = value.length;

  // Interpret based on the number of trailing zeros
  if (strLength >= 18) {
    return `${BigNumber(value).dividedBy(10**18)} DMD`;
  } else if (strLength >= 9) {
    return `${BigNumber(value).dividedBy(10**9)} Gwei`;
  } else {
    return `${BigNumber(value).dividedBy(10**1)} Wei`;
  }
}

export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 7)}...${address.slice(-5)}`;
};