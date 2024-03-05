import React from "react";
import { useParams } from "react-router-dom";

import "./pooldetails.module.css";

interface PoolDetailsProps {}

const PoolDetails: React.FC<PoolDetailsProps> = ({}) => {
  const { poolAddress } = useParams();

  return (
    <div className="App">
      Pool Details Page | {poolAddress}
    </div>
  );
};

export default PoolDetails;