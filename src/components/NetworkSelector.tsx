import { useState } from "react";

const networks = [
  { id: 'solana', name: 'Solana', icon: '◎' },
  { id: 'bsc', name: 'BSC', icon: '🔶' },
  { id: 'ethereum', name: 'Ethereum', icon: 'Ξ' },
  { id: 'base', name: 'Base', icon: '🔵' },
  { id: 'polygon', name: 'Polygon', icon: '⬡' },
];

export const NetworkSelector = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('solana');

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide">
        {networks.map((network) => (
          <button
            key={network.id}
            onClick={() => setSelectedNetwork(network.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedNetwork === network.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            <span className="text-base">{network.icon}</span>
            <span>{network.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
