interface BuyButtonProps {
  accessoryId: string;
  owned: boolean;
  onBuy: (accessoryid: string) => void;
}

/**
 * button to allow the user to purchase the given accessory
 */
export function BuyButton({ accessoryId, owned, onBuy }: BuyButtonProps) {
  const handleClick = () => {
    onBuy(accessoryId);
  };
  return (
    <button
      className="primary narrow"
      onClick={() => void handleClick()}
      disabled={owned}
      style={{ opacity: owned ? 0.5 : 1 }}
    >
      {owned ? "Owned" : "Buy"}
    </button>
  );
}
