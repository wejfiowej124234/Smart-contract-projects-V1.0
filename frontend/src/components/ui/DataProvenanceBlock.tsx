import {
  dataSourceExpandLabel,
  dataSourceBlockLabel,
  dataSourceUpdatedLabel,
  dataSourceBlockTimestampAgoTemplate,
  dataSourceBlockTimestampTooltip,
  dataSourceOracleAddressLabel,
  dataSourceOracleSourceLabel,
  dataSourceOracleSourceOnChain,
  dataSourceOracleDelayLabel,
  dataSourceOracleDelayBlocksTemplate,
  dataSourceOracleDelayUnknown,
  dataSourceOracleDelayUnknownReason,
  dataSourcePrecisionLabel,
  dataSourcePrecisionUsdHint,
  dataSourceFormulaHfHint,
  dataSourceFormulaRatesHint,
  viewOnExplorerLabel,
  emptyPlaceholder,
} from "../../config/ui";
import { shortAddress, formatBlockTimestampAgo } from "../../utils/format";
import { getBlockExplorerAddressUrl } from "../../config/network";

export function DataProvenanceBlock(props: {
  blockNumber: number | undefined;
  blockTimestamp?: number;
  updatedAt: string;
  oracleAddress: string | undefined;
  chainId: number | undefined;
  /** Oracle delay in blocks (if contract exposes). */
  oracleDelayBlocks?: number;
  /** When true, show formula hints for rates (Markets). */
  showRatesFormula?: boolean;
}) {
  const { blockNumber, blockTimestamp, updatedAt, oracleAddress, chainId, oracleDelayBlocks, showRatesFormula } = props;
  const oracleUrl = oracleAddress && chainId != null ? getBlockExplorerAddressUrl(chainId, oracleAddress) : undefined;
  const blockAgo = blockTimestamp != null ? formatBlockTimestampAgo(blockTimestamp) : "";
  const blockLine = blockAgo ? dataSourceBlockTimestampAgoTemplate.replace("{block}", String(blockNumber ?? "—")).replace("{ago}", blockAgo) : null;
  return (
    <details className="dataProvenanceBlock" data-testid="data-provenance">
      <summary className="dataProvenanceSummary">{dataSourceExpandLabel}</summary>
      <div className="dataProvenanceContent">
        <div className="dataProvenanceRow">
          <span className="dataProvenanceLabel">{dataSourceBlockLabel}:</span>
          <span className="dataProvenanceValue">{blockNumber ?? emptyPlaceholder}</span>
        </div>
        {blockLine != null && (
          <div className="dataProvenanceRow">
            <span className="dataProvenanceLabel" />
            <span className="dataProvenanceValue dataProvenanceHint" title={dataSourceBlockTimestampTooltip}>{blockLine}</span>
          </div>
        )}
        <div className="dataProvenanceRow">
          <span className="dataProvenanceLabel">{dataSourceUpdatedLabel}:</span>
          <span className="dataProvenanceValue">{updatedAt}</span>
        </div>
        {oracleAddress && (
          <>
            <div className="dataProvenanceRow">
              <span className="dataProvenanceLabel">{dataSourceOracleSourceLabel}:</span>
              <span className="dataProvenanceValue dataProvenanceHint">{dataSourceOracleSourceOnChain}</span>
            </div>
            <div className="dataProvenanceRow">
              <span className="dataProvenanceLabel">{dataSourceOracleAddressLabel}:</span>
              <span className="dataProvenanceValue">
              {oracleUrl ? (
                <a href={oracleUrl} target="_blank" rel="noreferrer" className="dataProvenanceLink">
                  {shortAddress(oracleAddress)} ({viewOnExplorerLabel})
                </a>
              ) : (
                shortAddress(oracleAddress)
              )}
            </span>
            </div>
          </>
        )}
        {oracleAddress != null && (
          <div className="dataProvenanceRow">
            <span className="dataProvenanceLabel">{dataSourceOracleDelayLabel}:</span>
            <span className="dataProvenanceValue dataProvenanceHint" title={oracleDelayBlocks == null ? dataSourceOracleDelayUnknownReason : undefined}>
              {oracleDelayBlocks != null ? dataSourceOracleDelayBlocksTemplate.replace("{n}", String(oracleDelayBlocks)) : dataSourceOracleDelayUnknown}
            </span>
          </div>
        )}
        <div className="dataProvenanceRow">
          <span className="dataProvenanceLabel">{dataSourcePrecisionLabel}:</span>
          <span className="dataProvenanceValue dataProvenanceHint">{dataSourcePrecisionUsdHint}</span>
        </div>
        <div className="dataProvenanceFormula">
          <span className="dataProvenanceHint">{dataSourceFormulaHfHint}</span>
          {showRatesFormula && (
            <>
              {" "}
              <span className="dataProvenanceHint">{dataSourceFormulaRatesHint}</span>
            </>
          )}
        </div>
      </div>
    </details>
  );
}
