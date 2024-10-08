export interface IPool {
    isUpdating: boolean;
    isActive: boolean;
    isToBeElected: boolean;
    isPendingValidator: boolean;
    isAvailable: boolean;
    stakingAddress: string;
    ensName: string;
    miningAddress: string;
    miningPublicKey: string;
    addedInEpoch: number;
    isCurrentValidator: boolean;
    score: number;
    candidateStake: BN;
    totalStake: BN;
    myStake: BN;
    orderedWithdrawAmount: BN;
    claimableStake: ClaimableStake;
    delegators: Array;
    isMe: boolean;
    validatorStakeShare: number;
    validatorRewardShare: number;
    claimableReward: string;
    keyGenMode: KeyGenMode;
    parts: string;
    numberOfAcks: number;
    availableSince: BN;
}