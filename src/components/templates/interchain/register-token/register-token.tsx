import React, { useEffect, useState } from 'react';
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
} from '@chakra-ui/react';
import { useContractWrite, useWaitForTransaction, useAccount } from 'wagmi';
import crypto from 'crypto';
import { ethers } from 'ethers';
import interchainTokenFactoryContractABI from '../../../../../contracts/InterchainTokenFactoryABI.json';

const interchainTokenFactoryContractAddress = '0x83a93500d23Fbc3e82B410aD07A6a9F7A0670D66';

const RegisterExistingToken: React.FC = () => {
  const { address } = useAccount();
  const toast = useToast();
  const [displayTransactionHash, setDisplayTransactionHash] = useState<string>('');
  const [showNextStep, setShowNextStep] = useState<boolean>(false);

  const [tokenAddress, setTokenAddress] = useState<string>('');

  // Register existing token
  const { data: registerToken, write } = useContractWrite({
    address: interchainTokenFactoryContractAddress,
    abi: interchainTokenFactoryContractABI,
    functionName: 'registerCanonicalInterchainToken',
    args: [
      tokenAddress, // your token address
    ],
    mode: 'recklesslyUnprepared',
  });

  const {
    data: useWaitForDeployTokenTransactionData,
    isSuccess,
    isError,
    isLoading,
  } = useWaitForTransaction({
    hash: registerToken?.hash,
  });

  // Method to handle token registration to be used in the 'Register' button
  // onClick event
  const handleRegisterToken = async () => {
    if (!tokenAddress) {
      toast({
        title: 'Invalid Input',
        description: 'Please fill the field correctly.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      return;
    }

    write();
    toast({
      title: 'Transaction Submitted',
      description: 'Please confirm the transaction in MetaMask.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  useEffect(() => {
    if (isSuccess) {
      setDisplayTransactionHash(registerToken?.hash ?? '');

      toast({
        title: 'Token Registration Successful',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Clear only the input fields
      setTokenAddress('');
      setShowNextStep(true);
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
  }, [registerToken, isSuccess, isError, isLoading, useWaitForDeployTokenTransactionData]);

  return (
    <Box padding="7" maxW="xxl" borderWidth="1px" borderRadius="lg" overflow="hidden" margin="auto" marginTop="-20">
      <Heading size="lg" marginBottom="6" textAlign="center">
        Register Canonical Interchain Token
      </Heading>
      <VStack spacing={5} align="stretch">
        <FormControl>
          <FormLabel>Token Address </FormLabel>
          <Input
            placeholder="Enter token address"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />
          <FormHelperText>Enter your existing token address you already deployed</FormHelperText>
        </FormControl>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            colorScheme="cyan"
            loadingText="Creating Token"
            w="sm"
            variant="solid"
            onClick={handleRegisterToken} // update here
          >
            Register Token
          </Button>
          {showNextStep && (
            <Button
              colorScheme="green"
              onClick={() => {
                window.location.href = '/interchain/deploy-token';
              }}
              w="sm"
              variant="solid"
            >
              Deploy Token Remotely
            </Button>
          )}
        </div>
        {displayTransactionHash && (
          <Alert status="info" variant="left-accent" marginTop="2" marginBottom="2">
            <AlertIcon />
            Transaction Hash:
            <Link
              href={`https://testnet.ftmscan.com/tx/${displayTransactionHash}`}
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

export default RegisterExistingToken;
