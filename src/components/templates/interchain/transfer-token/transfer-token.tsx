/* eslint-disable no-inline-comments */
import {
  VStack,
  Heading,
  Box,
  Text,
  Button,
  Input,
  useToast,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  Link,
  Stack,
  Select,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useContractWrite, useWaitForTransaction, erc20ABI } from 'wagmi';
import { AxelarQueryAPI, Environment, GasToken } from '@axelar-network/axelarjs-sdk';
import interchainTokenServiceContractABI from '../../../../../contracts/interchainTokenServiceABI.json';
const interchainTokenServiceContractAddress = '0xB5FB4BE02232B1bBA4dC8f81dc24C26980dE9e3C';
import { ethers } from 'ethers';

const TransferToken = () => {
  const toast = useToast();
  const [displayTransactionHash, setDisplayTransactionHash] = useState<string>('');

  const [sourceChain, setSourceChain] = useState<string>('');
  const [destinationChain, setDestinationChain] = useState<string>('');
  const [receiverAddress, setReceiverAddress] = useState<string>('');
  const [amountToTransfer, setAmountToTransfer] = useState<number>(0);
  const [interchainTokenContractAddress, setInterchainTokenContractAddress] = useState<string>('');

  const [approveButonVisibility, setApproveButtonVisibility] = useState<boolean>(true);
  const [formVisibility, setFormVisibility] = useState<boolean>(false);

  // Approve token to be spent by the contract
  const { data: useContractWriteSpendData, write: approveWrite } = useContractWrite({
    address: '0x6f1205e4A044b03251292ac7278E150F26e00592', // Address of the token contract on Fantom
    abi: erc20ABI,
    functionName: 'approve',
    args: [interchainTokenServiceContractAddress, ethers.utils.parseUnits(amountToTransfer.toString(), 18)],
    mode: 'recklesslyUnprepared',
  });

  const {
    data: useWaitForTransactionSpendData,
    isSuccess: isSpendSuccess,
    isLoading: isSpendLoading,
  } = useWaitForTransaction({
    hash: useContractWriteSpendData?.hash,
  });

  // Handle Approval
  const handleApprove = () => {
    if (!amountToTransfer) {
      toast({
        title: 'Please enter amount',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    approveWrite();

    toast({
      title: 'Approving Token...',
      description: 'Please confirm the transaction in Metamask.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  const api: AxelarQueryAPI = new AxelarQueryAPI({ environment: Environment.TESTNET });
  const [gasAmount, setGasAmount] = useState<number>(0);

  // Estimate Gas
  const gasEstimator = async () => {
    try {
      const gas = await api.estimateGasFee(sourceChain, destinationChain, 700000, 2, GasToken.FTM);
      setGasAmount(Number(gas));
    } catch (error) {
      console.error('Error estimating gas fee: ', error);
    }
  };

  // Token Transfer
  const { data: tokenTransfer, write } = useContractWrite({
    address: interchainTokenServiceContractAddress,
    abi: interchainTokenServiceContractABI,
    functionName: 'interchainTransfer',
    args: [
      ethers.utils.arrayify('0x43DAE7E25FE1E690EEE852A3701C3DB8F0A76CD24E2A3A20AF011D552F08D82A'),
      destinationChain,
      receiverAddress,
      ethers.utils.parseEther(amountToTransfer.toString()),
      '0x',
      ethers.BigNumber.from(gasAmount.toString()),
    ],
    overrides: {
      value: ethers.BigNumber.from(gasAmount.toString()),
    },
    mode: 'recklesslyUnprepared',
  });

  const {
    data: useWaitForTokenTransferTransactionData,
    isSuccess,
    isError,
    isLoading,
  } = useWaitForTransaction({
    // Call a hook to wait for the transaction to be mined
    hash: tokenTransfer?.hash,
  });

  // token transfer
  const handleTokenTransfer = async () => {
    if (!sourceChain || !destinationChain || !receiverAddress || !amountToTransfer) {
      toast({
        title: 'Invalid Input',
        description: 'Please fill all the fields correctly.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (write) {
      write();
      toast({
        title: 'Transaction Submitted',
        description: 'Please confirm the transaction in Metamask.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }

    if (isError) {
      toast({
        title: 'Transaction Error',
        description: 'There was an error submitting your transaction.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    gasEstimator();
    if (isSuccess) {
      setDisplayTransactionHash(tokenTransfer?.hash ?? '');
      toast({
        title: 'Token Transfer Initiated',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }

    if (isError) {
      toast({
        title: 'Transaction Error',
        description: 'There was an error submitting your transaction.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    if (isLoading) {
      toast({
        title: 'Transaction Pending',
        description: 'Your transaction is pending.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }

    if (isSpendSuccess) {
      toast({
        title: 'Token Approved',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setApproveButtonVisibility(false);
      setFormVisibility(true);
    }
  }, [
    tokenTransfer,
    isSuccess,
    isError,
    isLoading,
    useWaitForTokenTransferTransactionData,
    useWaitForTransactionSpendData,
  ]);

  return (
    <Box padding="7" maxW="xxl" borderWidth="1px" borderRadius="lg" overflow="hidden" margin="auto" marginTop="-20">
      <Heading size="lg" marginBottom="6" textAlign="center">
        Transfer Interchain Token
      </Heading>
      <VStack spacing={5} align="stretch">
        {formVisibility && (
          <>
            <FormControl>
              <FormLabel>Source Chain Name</FormLabel>
              <Stack spacing={3}>
                <Select
                  placeholder="Select source chain"
                  value={sourceChain}
                  onChange={(e) => setSourceChain(e.target.value)}
                  size="md"
                >
                  <option value="Fantom">Fantom</option>
                  <option value="celo">Celo</option>
                  <option value="binance">Binance</option>
                  <option value="Polygon">Polygon</option>
                  <option value="Avalanche">Avalanche</option>
                  <option value="ethereum-sepolia">Ethereum Sepolia</option>
                </Select>
              </Stack>
              <FormHelperText>Source chain for your token eg. Fantom, binance, Polygon etc.</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Token Contract Address</FormLabel>
              <Input
                placeholder="Enter Token Contract Address"
                value={interchainTokenContractAddress}
                onChange={(e) => setInterchainTokenContractAddress(e.target.value)}
              />
              <FormHelperText>Token Address</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Destination Chain</FormLabel>
              <Stack spacing={3}>
                <Select
                  placeholder="Select Destination chain"
                  value={destinationChain}
                  onChange={(e) => setDestinationChain(e.target.value)}
                  size="md"
                >
                  <option value="Fantom">Fantom</option>
                  <option value="celo">Celo</option>
                  <option value="binance">Binance</option>
                  <option value="Polygon">Polygon</option>
                  <option value="Avalanche">Avalanche</option>
                  <option value="ethereum-sepolia">Ethereum Sepolia</option>
                </Select>
              </Stack>
              <FormHelperText>Destination chain for your token eg. Fantom, binance, Polygon etc.</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Receiver Address</FormLabel>
              <Input
                placeholder="Enter Receiver Address"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
              />
              <FormHelperText>Receiver address for your token.</FormHelperText>
            </FormControl>
          </>
        )}
        <FormControl>
          <FormLabel>Amount to Transfer</FormLabel>
          <Input
            placeholder="Enter Amount to Transfer"
            value={amountToTransfer}
            onChange={(e) => setAmountToTransfer(Number(e.target.value))}
          />
          <FormHelperText>Amount to transfer to the receiver address.</FormHelperText>
        </FormControl>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {approveButonVisibility && (
            <Button
              colorScheme="blue"
              onClick={handleApprove}
              isLoading={isSpendLoading}
              loadingText="Approving Token..."
              w="sm"
              variant="solid"
              disabled={isSpendLoading}
            >
              Approve
            </Button>
          )}

          <Button
            colorScheme="cyan"
            onClick={handleTokenTransfer}
            isLoading={isLoading}
            loadingText="Transferring Token..."
            w="sm"
            variant="solid"
            disabled={isLoading}
          >
            Transfer Token
          </Button>
        </div>
        {displayTransactionHash && (
          <Alert status="info" variant="left-accent" marginTop="2" marginBottom="2">
            <AlertIcon />
            Transaction Hash:
            <Link
              href={`https://testnet.axelarscan.io/gmp/${displayTransactionHash}`}
              isExternal
              color="blue.500"
              paddingLeft="2"
            >
              {displayTransactionHash}
            </Link>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default TransferToken;
