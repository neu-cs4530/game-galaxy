interface BuyButtonProps {
  accessoryId: string;
  owned: boolean;
  onBuy: (accessoryid: string) => void;
  cost: number;
  balance: number;
}

/**
 * button to allow the user to purchase the given accessory
 */
export function BuyButton({ accessoryId, owned, onBuy, cost, balance }: BuyButtonProps) {
  const handleClick = () => {
    onBuy(accessoryId);
  };

  return (
    <button
      className="primary narrow"
      onClick={() => void handleClick()}
      disabled={owned || balance < cost}
      style={{ opacity: owned || balance < cost ? 0.5 : 1 }}
    >
      {owned ? "Owned" : "Buy"}
    </button>
  );
}
