import React, { useEffect, useState, useRef } from "react";
import styles from "./styles.module.css";
import BigNumber from "bignumber.js";
import { formatCryptoUnitValue } from "../../utils/common";

interface ProposalStepSliderProps {
    state: string;
    contractName: string;
    paramsRange: string[];
    setState: (value: string) => void;
}

const ProposalStepSlider: React.FC<ProposalStepSliderProps> = ({ contractName, paramsRange, state, setState }) => {
    const [startingVal, setStartingVal] = useState<string | undefined>(undefined);
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        setStartingVal(state);
    }, [paramsRange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = BigNumber(e.target.value);

        if (startingVal) {
            const currIndex = paramsRange.indexOf(startingVal);
            const leftVal = currIndex > 0 ? paramsRange[currIndex - 1] : paramsRange[0];
            const rightVal =
                currIndex < paramsRange.length - 1 ? paramsRange[currIndex + 1] : paramsRange[paramsRange.length - 1];

            if (newValue.isGreaterThan(leftVal) && newValue.isLessThan(rightVal)) {
                setState(startingVal.toString());
            } else {
                if (newValue.isLessThanOrEqualTo(leftVal)) {
                    setState(leftVal);
                } else {
                    setState(rightVal);
                }
            }
        }
    };

    const getSliderPercentage = () => {
        const current = BigNumber(state);
        const min = BigNumber(paramsRange[0]);
        const max = BigNumber(paramsRange[paramsRange.length - 1]);
        return current.minus(min).dividedBy(max.minus(min)).multipliedBy(100).toFixed(2);
    };

    const getAdjustedLeft = () => {
        const percentage = parseFloat(getSliderPercentage());
        const textWidth = textRef.current?.offsetWidth || 0;
        const containerWidth = textRef.current?.parentElement?.offsetWidth || 0;

        // Calculate the left offset
        let leftOffset = percentage - textWidth / containerWidth * 50;

        // Prevent overflow on the left
        if (leftOffset < 0) {
            leftOffset = 0;
        }

        // Prevent overflow on the right
        if (leftOffset > 100 - (textWidth / containerWidth) * 100) {
            leftOffset = 100 - (textWidth / containerWidth) * 100;
        }

        return `${leftOffset}%`;
    };

    return (
        <div className={styles.sliderContainer}>
            <div className={styles.valContainer}>
                <span
                    ref={textRef}
                    className={styles.currentValue}
                    style={{
                        left: getAdjustedLeft(),
                    }}
                >
                    {state == startingVal ? "Current" : "Change to" }: <strong>{contractName === "Block Reward" ? `${state} %` : formatCryptoUnitValue(state)}</strong>
                </span>
            </div>
            <div>
                <input
                    type="range"
                    min={paramsRange[0]}
                    max={paramsRange[paramsRange.length - 1]}
                    value={state}
                    onChange={handleChange}
                    className={styles.rangeInput}
                />

                <div className={styles.valContainer}>
                    <div>
                        <span>Min. </span>
                        <span>{contractName === "Block Reward" ? `${paramsRange[0]} %` : formatCryptoUnitValue(paramsRange[0])}</span>
                    </div>
                    <div>
                        <span>Max. </span>
                        <span>{contractName === "Block Reward" ? `${paramsRange[paramsRange.length - 1]} %` : formatCryptoUnitValue(paramsRange[paramsRange.length - 1])}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalStepSlider;
