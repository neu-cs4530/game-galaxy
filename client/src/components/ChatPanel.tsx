import "./ChatPanel.css";
import MessageCreation from "@gamegalaxy/client/src/components/MessageCreation.tsx";
import MessageList from "@gamegalaxy/client/src/components/MessageList.tsx";
import useSocketsForChat from "@gamegalaxy/client/src/hooks/useSocketsForChat.ts";

interface ChatProps {
  chatId: string;
}

/**
 * A chat panel allows viewing and updating messages in live chat
 */
export default function ChatPanel({ chatId }: ChatProps) {
  const { messages, handleMessageCreation } = useSocketsForChat(chatId);
  return (
    messages && (
      <div className="chatContainer">
        <MessageList messages={messages} />
        <MessageCreation handleMessageCreation={handleMessageCreation} />
      </div>
    )
  );
}
