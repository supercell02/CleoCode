import { useState, useEffect , useMemo,useRef} from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import type { InferResponseType } from "hono/client";
import { useKeyboard } from "@opentui/react";
import { type ModeType, type SupportedChatModelId} from "@CleoCode/shared";
import { SessionShell } from "../components/session-shell";
import { UserMessage, BotMessage , ErrorMessage} from "../components/messages";
import { useToast } from "../providers/toast";
import { useChat } from "../hooks/use-chat";
import { usePromptConfig } from "../providers/prompt-config";
import type { Message } from "../hooks/use-chat";
import { apiClient } from "../lib/api-client";
import { getErrorMessage } from "../lib/http-errors";
import { useKeyboardLayer } from "../providers/keyboard-layer";

type SessionData = InferResponseType<(typeof apiClient.sessions)[":id"]["$get"], 200>;

const sessionLocationSchema = z.object({
  session: z.custom<SessionData>((val) => val != null && typeof val === "object" && "id" in val, ),
  initialPrompt: z
    .object({
      message: z.string(),
      mode: z.custom<ModeType>(),
      model: z.custom<SupportedChatModelId>(),
    })
    .optional(),
});

function ChatMessage(
  { msg }:{
    msg: Message
  }
){
  if (msg.role === "user") {
    const text = msg.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
    return <UserMessage message={text} mode={msg.metadata?.mode ?? "BUILD"} />;
  }

  return (<BotMessage 
     parts={msg.parts}
     model={msg.metadata?.model ?? "unknown"}
     mode={msg.metadata?.mode ?? "BUILD"}
     durationMs={msg.metadata?.durationMs}
     streaming={false}
  />);
};

function SessionChat({ 
  session,
  initialPrompt,
}: { 
  initialPrompt?: {
    message: string;
    mode: ModeType;
    model: SupportedChatModelId;
  };
session: SessionData }) {
  const [initialMessages] = useState(() => session.messages as unknown as Message[]);
  const { isTopLayer } = useKeyboardLayer();
  const { messages, status, sessionUsage, submit, abort , interrupt ,error } = useChat(
    session.id, 
    initialMessages
  );

  const hasSubmittedInitialPromptRef = useRef(false);

  const { mode, model } = usePromptConfig();

  useEffect(() => {
    return () => {
      void abort();
    };
  },[abort]);

  useKeyboard((key) => {
    if (key.name === "escape" && isTopLayer("base") && status === "streaming"){
      key.preventDefault();
      interrupt();
    }
  });

  useEffect(() => {
    if (!initialPrompt || hasSubmittedInitialPromptRef.current) return;
    hasSubmittedInitialPromptRef.current = true;
    void submit({
      userText: initialPrompt.message,
      mode: initialPrompt.mode,
      model: initialPrompt.model
    });
  },[initialPrompt, submit])

  return (
    <SessionShell
      onSubmit={(text) => submit({ userText: text, mode: mode, model: model })}
      loading={status === "submitted" || status === "streaming"}
      interruptible={status === "submitted" || status === "streaming"}
      usage={sessionUsage}
    >
      {messages.map((msg) => (
        <ChatMessage key={msg.id} msg={msg} />
      ))}
      {error && <ErrorMessage message={error.message} />}
    </SessionShell>
  )
}

export function Session() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const prefetched = useMemo(() => {
    const parsed  = sessionLocationSchema.safeParse(location.state);
    return parsed.success ? parsed.data : null;
  },[location.state]);

  const [session, setSession] = useState<SessionData | null>(prefetched?.session ?? null);

  useEffect(() =>{
    if (prefetched?.session) return;

    setSession(null);

    if (!id) return;

    let ignore = false;

    const fetchSession = async () => {
      try {
        const res = await apiClient.sessions[":id"].$get({
           param: { id } 
          });
        if (ignore) return;
        if (!res.ok) throw new Error(await getErrorMessage(res));
        const resolved = await res.json();
        setSession(resolved);
      } catch(err) {
        if (ignore) return;
        toast.show({
          variant: "error",
          message: err instanceof Error ? err.message : "Failed to load session",
        });
        navigate("/", { replace: true });
      }
    };

    fetchSession();
    return () => {
      ignore = true;
    };
  },[ id, navigate, toast, prefetched]);

  if (!session) {
    return (
      <SessionShell onSubmit={() => {}} inputDisabled loading>
        {null}
      </SessionShell>
    );
  }
return (
  <SessionChat 
    session={session} 
    key={session.id} 
    initialPrompt={prefetched?.initialPrompt} 
  />);
};
