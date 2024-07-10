import { startTransition, useEffect, useState } from "react";
import { FaFilter } from "react-icons/fa";

import ProposalsTable from "../../../components/ProposalsTable";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import Navigation from "../../../components/Navigation";
import { useDaoContext } from "../../../contexts/DaoContext";
import { useWeb3Context } from "../../../contexts/Web3Context";
import { Proposal } from "../../../contexts/DaoContext/types";

const HistoricProposals = () => {
  const navigate = useNavigate();
  const daoContext = useDaoContext();
  const web3Context = useWeb3Context();
  
  const [fetching, setFetching] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [filterFinalize, setFilterFinalize] = useState<boolean>(true);
  const [indexingStatus, setIndexingStatus] = useState<string | null>(
    "Indexing: Fetching historic proposals count"
  );

  const handleDetailsClick = (proposalId: string) => {
    startTransition(() => {
      navigate(`/dao/details/${proposalId}`);
    });
  };

  useEffect(() => {
    if (!fetching) {
      web3Context.showLoader(true, "Fetching historic proposals");
      daoContext.getHistoricProposals();
      setFetching(true);
    } else {
      const totalProposals = daoContext.allDaoProposals.length;
      totalProposals > 0 && web3Context.showLoader(false, "");
      const totalFetched = daoContext.allDaoProposals.filter((proposal: Proposal) => proposal.state !== '').length;
      const indexingPercentage = Math.round((totalFetched / totalProposals) * 100);
      if (indexingPercentage === 100) {
        setIndexingStatus(null);
      } else {
        setIndexingStatus(`Indexing: ${indexingPercentage}% complete`);
      }
    }
  }, [daoContext.allDaoProposals]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterQuery(event.target.value);
  }

  return (
    <section className="section">
        <div className={styles.sectionContainer + " sectionContainer"}>

        <Navigation start="/dao" />

        <div className={styles.historicProposalsInfoContainer}>
          <div>
            <h1 className={styles.historicProposalsHeading}>Historic Proposals</h1>

            <div className={styles.filterContainer}>
              <input type="text" placeholder="Search" className={styles.historicProposalsSearch} onChange={e => setFilterQuery(e.target.value)}/>

              <select className={styles.historicProposalsSelect} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="unfinalized">Unfinalized</option>
              </select>
            </div>

            <div>{indexingStatus ? indexingStatus : ""}</div>
          </div>
        </div>

        {
          daoContext.allDaoProposals.length !== 0 ? (
            <ProposalsTable
              data={daoContext.allDaoProposals}
              handleDetailsClick={handleDetailsClick}
              getStateString={daoContext.getStateString}
              filterQuery={filterQuery}
              columns={["Result"]}
            />
          ) : (
            <div className={styles.historicProposalsInfoContainer}>
              <div>
                <div>No historic proposals found</div>
              </div>
            </div>
          )
        }

      </div>
    </section>
  );
};

export default HistoricProposals;
