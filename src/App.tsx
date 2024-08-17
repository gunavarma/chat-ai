import React, { useState, useRef, useEffect } from "react";
import { Button, Spin } from "antd";
import TextArea from "antd/es/input/TextArea";
import Layout, { Content, Footer, Header } from "antd/es/layout/layout";
import axios from "axios";
import { BsFillSendFill, BsArrowRepeat } from "react-icons/bs";
import { IoLogoSoundcloud } from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-github";
import { FaCopy } from "react-icons/fa";
import toast from "react-hot-toast";

function ChatBubble({
  text,
  isUser,
  isLoading,
  isCode,
  language,
  onCopy,
  onRegenerate,
}: {
  text: string;
  isUser: boolean;
  isLoading?: boolean;
  isCode?: boolean;
  language?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
}) {
  return (
    <>
      {isUser ? (
        <div className="p-3 max-w-[80%] rounded-2xl bg-blue-500 text-white self-end">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      ) : (
        <div className="flex gap-2 my-5 items-start">
          <div className="p-2 rounded-full border">
            <IoLogoSoundcloud className="text-white " />
          </div>
          {isLoading ? (
            <Spin className="p-2" />
          ) : isCode ? (
            <div>
              <div className="p-3 max-w-[80%] rounded-2xl overflow-hidden bg-[#434343] text-white">
                <AceEditor
                  mode={language || "javascript"}
                  theme="github"
                  name="code-editor"
                  value={text}
                  className="w-[80%]"
                  readOnly
                  showGutter={true}
                  highlightActiveLine={true}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <div onClick={onCopy} className="text-gray-500">
                  <FaCopy />
                </div>
                <div onClick={onRegenerate} className="text-gray-500">
                  <BsArrowRepeat />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="p-3 max-w-[80%] rounded-2xl bg-[#434343] text-white">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
              <div className="flex gap-2 mt-2">
                <div
                  onClick={onCopy}
                  className="text-gray-500 hover:bg-gray-600 hover:text-white cursor-pointer p-2 rounded-lg"
                >
                  <FaCopy />
                </div>
                <div
                  onClick={onRegenerate}
                  className="text-gray-500 hover:bg-gray-600 hover:text-white cursor-pointer p-2 rounded-lg"
                >
                  <BsArrowRepeat />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// App component
const App: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { text: string; isUser: boolean; isCode?: boolean; language?: string }[]
  >([]);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Code copied to clipboard!");
    });
  };

  const regenerateAnswer = (originalQuestion: string) => {
    generateAnswer({ preventDefault: () => {} }, originalQuestion);
  };

  async function generateAnswer(
    e: { preventDefault: () => void },
    originalQuestion: string = question
  ) {
    setGeneratingAnswer(true);
    e.preventDefault();
    setChatHistory((prev) => [
      ...prev,
      { text: originalQuestion, isUser: true },
    ]);
    setChatHistory((prev) => [
      ...prev,
      { text: "", isUser: false, isLoading: true },
    ]);

    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCinaZdx6yuylrZ7KIcYAnEOghLDw0_p4k`,
        method: "post",
        data: {
          contents: [{ parts: [{ text: originalQuestion }] }],
        },
      });

      const answer =
        response["data"]["candidates"][0]["content"]["parts"][0]["text"];
      const isCode = answer.startsWith("```") && answer.endsWith("```");
      const languageMatch = answer.match(/^```(\w+)/);
      const language = languageMatch ? languageMatch[1] : "javascript"; // Default to JavaScript

      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory.pop(); // Remove the loading bubble
        return [
          ...newHistory,
          {
            text: isCode ? answer.replace(/^```\w+\n|\n```$/g, "") : answer,
            isUser: false,
            isCode,
            language,
          },
        ];
      });
      localStorage.setItem("chatHistory", question);
      setQuestion("");
    } catch (error) {
      console.log(error);
      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory.pop(); // Remove the loading bubble
        return [
          ...newHistory,
          {
            text: "Sorry - Something went wrong. Please try again!",
            isUser: false,
          },
        ];
      });
    }

    setGeneratingAnswer(false);
  }

  return (
    <Layout className="h-screen bg-[#212121]">
      <Header className="text-white flex items-center bg-[#212121] justify-center gap-2 text-4xl font-bold font-sans">
        <IoLogoSoundcloud className="text-blue-500" />
        Cloud AI
      </Header>
      <Content>
        <div
          className="flex flex-col h-full overflow-y-auto md:px-[20%] px-10"
          ref={chatContainerRef}
        >
          {chatHistory.map((chat, index) => (
            <ChatBubble
              key={index}
              text={chat.text}
              isUser={chat.isUser}
              isLoading={generatingAnswer && !chat.isUser && !chat.text}
              isCode={chat.isCode}
              language={chat.language}
              onCopy={() => chat.isCode || handleCopy(chat.text)}
              onRegenerate={() =>
                chat.isCode ||
                regenerateAnswer(localStorage.getItem("chatHistory") as string)
              }
            />
          ))}
        </div>
      </Content>
      <Footer className="flex flex-col text-white items-center gap-2 bg-[#212121] md:px-[20%]">
        <span className="flex w-full bg-white rounded-3xl px-4 py-2">
          <TextArea
            size="middle"
            className="rounded-xl"
            value={question}
            variant="borderless"
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask Something"
            autoSize={{ minRows: 1, maxRows: 6 }}
            disabled={generatingAnswer}
          />
          <Button
            size="middle"
            type="text"
            loading={generatingAnswer}
            onClick={(e) => generateAnswer(e)}
            icon={<BsFillSendFill />}
          />
        </span>
        <span className="text-xs text-gray-400 text-center">
          Open source AI chatbot built with Google Gemini
        </span>
      </Footer>
    </Layout>
  );
};

export default App;
