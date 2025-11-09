import { useState } from "react";

const SolanaIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 397.7 311.7" fill="currentColor">
    <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"/>
    <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
    <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
  </svg>
);

const BSCIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 2500 2500" fill="currentColor">
    <path d="M764.48 1050.52 1250 565l485.75 485.73 282.5-282.5L1250 0 482.01 768.01l282.47 282.51m-481.99 199.51L0 1532.52l282.49 282.5 282.49-282.5-282.49-282.49m481.99 199.51L1250 1935l485.74-485.73 282.65 282.35-.14.15L1250 2500l-767.98-768.01.13-.13 282.33-282.32M1767.52 1250 1250 1767.51 732.48 1250 1250 732.48 1767.52 1250m749.99-217.51-282.5-282.49-282.49 282.49 282.49 282.49L2517.51 1032.49"/>
  </svg>
);

const EthereumIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 256 417" fill="currentColor">
    <path fillOpacity=".6" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
    <path d="M127.962 0L0 212.32l127.962 75.639V0z"/>
    <path fillOpacity=".6" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.601L256 236.587z"/>
    <path d="M127.962 416.905v-104.72L0 236.585z"/>
    <path fillOpacity=".2" d="M127.961 287.958l127.96-75.637-127.96-58.162z"/>
    <path fillOpacity=".6" d="m0 212.32 127.96 75.638v-133.8z"/>
  </svg>
);

const BaseIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 111 111" fill="none">
    <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="currentColor"/>
  </svg>
);

const PolygonIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 38.4 33.5" fill="currentColor">
    <path d="M29,10.2c-0.7-0.4-1.6-0.4-2.4,0L21,13.5l-3.8,2.1l-5.5,3.3c-0.7,0.4-1.6,0.4-2.4,0L5,16.3 c-0.7-0.4-1.2-1.2-1.2-2.1v-5c0-0.8,0.4-1.6,1.2-2.1l4.3-2.5c0.7-0.4,1.6-0.4,2.4,0L16,7.2c0.7,0.4,1.2,1.2,1.2,2.1v3.3l3.8-2.2V7 c0-0.8-0.4-1.6-1.2-2.1l-8-4.7c-0.7-0.4-1.6-0.4-2.4,0L1.2,5C0.4,5.4,0,6.2,0,7v9.4c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7 c0.7,0.4,1.6,0.4,2.4,0l5.5-3.2l3.8-2.2l5.5-3.2c0.7-0.4,1.6-0.4,2.4,0l4.3,2.5c0.7,0.4,1.2,1.2,1.2,2.1v5c0,0.8-0.4,1.6-1.2,2.1 L29,28.8c-0.7,0.4-1.6,0.4-2.4,0l-4.3-2.5c-0.7-0.4-1.2-1.2-1.2-2.1V21l-3.8,2.2v3.3c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7 c0.7,0.4,1.6,0.4,2.4,0l8.1-4.7c0.7-0.4,1.2-1.2,1.2-2.1V17c0-0.8-0.4-1.6-1.2-2.1L29,10.2z"/>
  </svg>
);

const networks = [
  { id: 'solana', name: 'Solana', icon: SolanaIcon },
  { id: 'bsc', name: 'BSC', icon: BSCIcon },
  { id: 'ethereum', name: 'Ethereum', icon: EthereumIcon },
  { id: 'base', name: 'Base', icon: BaseIcon },
  { id: 'polygon', name: 'Polygon', icon: PolygonIcon },
];

export const NetworkSelector = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('solana');

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide">
        {networks.map((network) => {
          const IconComponent = network.icon;
          return (
            <button
              key={network.id}
              onClick={() => setSelectedNetwork(network.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedNetwork === network.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              <IconComponent />
              <span>{network.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
