import axios from "axios";
import { useState } from "react";
import { BiSolidSend } from "react-icons/bi";
import { GrSend } from "react-icons/gr";

function ChatBubble({ text, isUser }: { text: string; isUser: boolean }) {
  return (
    <div
      className={`p-3 my-2 rounded-2xl max-w-xs   ${
        isUser ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-black"
      }`}
    >
      {text}
    </div>
  );
}

function App() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { text: string; isUser: boolean }[]
  >([]);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);

  async function generateAnswer(e: { preventDefault: () => void }) {
    setGeneratingAnswer(true);
    e.preventDefault();
    setChatHistory((prev) => [...prev, { text: question, isUser: true }]);
    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCinaZdx6yuylrZ7KIcYAnEOghLDw0_p4k`,
        method: "post",
        data: {
          contents: [{ parts: [{ text: question }] }],
        },
      });

      const answer =
        response["data"]["candidates"][0]["content"]["parts"][0]["text"];

      setChatHistory((prev) => [...prev, { text: answer, isUser: false }]);
      setQuestion("");
    } catch (error) {
      console.log(error);
      setChatHistory((prev) => [
        ...prev,
        {
          text: "Sorry - Something went wrong. Please try again!",
          isUser: false,
        },
      ]);
    }

    setGeneratingAnswer(false);
  }

  return (
    <div className=" rounded-lg shadow-lg h-screen bg-white  flex flex-col justify-between  transition-all duration-500">
      <span className="text-4xl font-bold text-blue-500 h-[10%] flex items-center justify-center text-center bg-gray-800">
        <BiSolidSend />
        Chat AI
      </span>
      <div className="flex flex-col bg-gray-700 h-full overflow-y-auto px-10 ">
        {chatHistory.map((chat, index) => (
          <ChatBubble key={index} text={chat.text} isUser={chat.isUser} />
        ))}
      </div>
      <form
        onSubmit={generateAnswer}
        className="flex items-center gap-5 bg-gray-800  p-10 h-[10%]"
      >
        <textarea
          required
          className="border border-gray-300 scrollbar-hide rounded-xl w-full px-4 py-2   transition-all duration-300 focus:border-blue-400 focus:shadow-lg"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything"
        ></textarea>
        <button
          type="submit"
          className={`bg-blue-500   px-5 py-3 gap-2 flex  items-center text-white rounded-xl hover:bg-blue-600 transition-all duration-300 ${
            generatingAnswer ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={generatingAnswer}
        >
          <GrSend />
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
