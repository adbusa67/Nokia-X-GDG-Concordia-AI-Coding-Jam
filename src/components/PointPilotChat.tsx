import { useEffect, useRef, useState, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Square, Trash2, Sparkles, Plane, AlertTriangle, Bot } from "lucide-react";
import { ChatMessage, User } from "../types/user";
import { getItem, setItem, removeItem, chatKey } from "../lib/storage";
import { streamChat, isLlmConfigured } from "../lib/llm";
import { CONVERSATION_STARTERS } from "../lib/pointPilotPrompt";
import { Button } from "./Button";

type Props = {
  /** Current user (kept fresh so the profile sent to the LLM reflects edits). */
  user: User;
};

export function PointPilotChat({ user }: Props) {
  const configured = isLlmConfigured();
  const storageKey = chatKey(user.id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load history on mount / when the user changes.
  useEffect(() => {
    const saved = getItem<ChatMessage[]>(storageKey);
    setMessages(Array.isArray(saved) ? saved : []);
  }, [storageKey]);

  // Persist history whenever it changes (skip empty in-flight bubbles).
  useEffect(() => {
    const toSave = messages.filter((m) => m.content.trim() !== "");
    if (toSave.length > 0) setItem(storageKey, toSave);
  }, [messages, storageKey]);

  // Abort any in-flight stream on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Auto-scroll to newest content.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading || !configured) return;

    // Snapshot the prior conversation, then add the user turn + an empty
    // assistant bubble that fills as tokens stream in.
    const withUser: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...withUser, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // `user` prop is always the latest wallet snapshot from the dashboard.
      await streamChat(withUser, user, {
        signal: controller.signal,
        onToken: (chunk) => {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant") {
              copy[copy.length - 1] = { ...last, content: last.content + chunk };
            }
            return copy;
          });
        },
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User stopped the stream — keep whatever streamed so far.
      } else {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please retry.";
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = {
              ...last,
              content: last.content || `⚠️ ${message}`,
            };
          }
          return copy;
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    removeItem(storageKey);
  };

  const nonEmpty = messages.filter((m) => m.content.trim() !== "");
  const isEmpty = nonEmpty.length === 0;
  const last = messages[messages.length - 1];
  const showTyping =
    loading && (!last || last.role !== "assistant" || last.content === "");

  return (
    <div className="relative flex h-[600px] flex-col overflow-hidden rounded-2xl border border-pilot/30 bg-white/5 backdrop-blur-xl shadow-2xl shadow-pilot/10 lg:h-[720px]">
      {/* Accent glow distinct from Amex/Aeroplan */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-pilot/20 blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pilot to-indigo-500 shadow-lg shadow-pilot/40">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
              PointPilot
              <span className="rounded-full bg-pilot/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pilot">
                AI
              </span>
            </h2>
            <p className="text-xs text-gray-400">Your AI award-travel expert</p>
          </div>
        </div>
        {!isEmpty && (
          <Button variant="ghost" size="sm" onClick={clearChat} title="Clear chat">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear chat</span>
          </Button>
        )}
      </div>

      {/* Message list */}
      <div ref={scrollRef} className="pp-scroll flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
        {isEmpty && !loading && (
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pilot/15 text-pilot">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Hi {user.username.split(" ")[0]}, I'm PointPilot ✈️
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              I read your wallet and preferences to find the best ways to spend your
              points. Pick a starter or ask me anything.
            </p>

            {configured && (
              <div className="mt-5 grid gap-2 text-left">
                {CONVERSATION_STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 transition-colors hover:border-pilot/40 hover:bg-pilot/10"
                  >
                    <Plane className="h-4 w-4 flex-shrink-0 text-pilot" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "assistant" && m.content === "" ? null : (
            <MessageBubble
              key={i}
              message={m}
              avatarUrl={user.avatarUrl}
              username={user.username}
            />
          )
        )}

        {showTyping && <TypingIndicator />}
      </div>

      {/* Input area */}
      <div className="relative border-t border-white/10 p-3 sm:p-4">
        {configured ? (
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask PointPilot… (Enter to send, Shift+Enter for a new line)"
              className="pp-scroll max-h-36 min-h-[46px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 backdrop-blur focus:border-pilot/50 focus:outline-none focus:ring-2 focus:ring-pilot/30"
              disabled={loading}
            />
            {loading ? (
              <Button
                variant="secondary"
                onClick={stop}
                className="h-[46px]"
                aria-label="Stop generating"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="!bg-pilot !shadow-pilot/30 hover:!bg-[#8f74ff] h-[46px]"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>
              Add your CURSOR_API_KEY to <code>.env</code> and run{" "}
              <code>npm run dev:all</code> to enable PointPilot.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  avatarUrl,
  username,
}: {
  message: ChatMessage;
  avatarUrl: string;
  username: string;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex animate-fade-in items-start justify-end gap-2.5">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-amex px-4 py-2.5 text-sm text-white shadow-lg shadow-amex/20">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <img
          src={avatarUrl}
          alt={username}
          className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-white/20"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex animate-fade-in items-start gap-2.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pilot to-indigo-500">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-black/10">
        <div className="pp-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex animate-fade-in items-start gap-2.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pilot to-indigo-500">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-pilot [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-pilot [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-pilot" />
        </div>
      </div>
    </div>
  );
}
